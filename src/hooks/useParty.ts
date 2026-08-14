import { useCallback, useEffect, useState } from 'react'
import { supabase, toKoreanError, type PartyMemberRow, type PartyRow } from '../supabase'
import { decodeBirth, encodeBirth, type Member } from '../saju'

/** DB의 birth 문자열을 앱이 쓰는 Member로. 못 읽는 행은 버린다. */
function toMember(r: PartyMemberRow): (Member & { rowId: string; addedBy: string | null }) | null {
  const birth = decodeBirth(r.birth)
  return birth ? { name: r.name, birth, rowId: r.id, addedBy: r.added_by } : null
}

export type PartyMember = NonNullable<ReturnType<typeof toMember>>

/**
 * 링크로 연 모임 하나. 서버가 진실이고 화면은 구독으로 따라간다.
 * partyId가 null이면 아무것도 안 한다.
 */
export function useParty(partyId: string | null, userId: string | null) {
  const [party, setParty] = useState<PartyRow | null>(null)
  const [members, setMembers] = useState<PartyMember[]>([])
  const [loading, setLoading] = useState(partyId !== null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!supabase || !partyId) return
    try {
      const [p, m] = await Promise.all([
        supabase.from('parties').select('*').eq('id', partyId).maybeSingle(),
        supabase.from('party_members').select('*').eq('party_id', partyId).order('created_at'),
      ])
      if (p.error) throw p.error
      if (m.error) throw m.error
      setParty(p.data)
      setMembers(((m.data ?? []) as PartyMemberRow[]).map(toMember).filter((x) => x !== null))
      setError(p.data ? null : '없는 모임이에요. 링크가 잘렸거나 삭제됐을 수 있어요.')
    } catch (e) {
      setError(toKoreanError(e, '모임을 불러오지 못했어요.'))
    } finally {
      setLoading(false)
    }
  }, [partyId])

  useEffect(() => {
    if (!supabase || !partyId) {
      setLoading(false)
      return
    }
    setLoading(true)
    reload()

    // 누가 자기를 넣으면 새로고침 없이 내 화면에도 뜬다.
    const db = supabase
    const channel = db
      .channel(`party:${partyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${partyId}` },
        () => reload(),
      )
      .subscribe()

    return () => {
      db.removeChannel(channel)
    }
  }, [partyId, reload])

  const add = async (m: Member) => {
    if (!supabase || !partyId) return
    try {
      const { error } = await supabase.from('party_members').insert({
        party_id: partyId,
        name: m.name,
        birth: encodeBirth(m.birth),
        added_by: userId,
      })
      if (error) throw error
      await reload()
    } catch (e) {
      alert(toKoreanError(e, '추가하지 못했어요.'))
    }
  }

  const remove = async (rowId: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from('party_members').delete().eq('id', rowId)
      if (error) throw error
      await reload()
    } catch (e) {
      alert(toKoreanError(e, '빼지 못했어요. 모임을 만든 사람만 뺄 수 있어요.'))
    }
  }

  const isOwner = party !== null && userId !== null && party.owner_id === userId

  return { party, members, loading, error, isOwner, add, remove }
}

/** 로그인한 사람이 만든 모임 목록. */
export function useMyParties(userId: string | null) {
  const [parties, setParties] = useState<(PartyRow & { count: number })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!supabase || !userId) {
      setParties([])
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*, party_members(count)')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setParties(
        (data ?? []).map((p) => ({
          ...(p as PartyRow),
          count: (p as { party_members?: { count: number }[] }).party_members?.[0]?.count ?? 0,
        })),
      )
      setError(null)
    } catch (e) {
      setError(toKoreanError(e, '모임 목록을 불러오지 못했어요.'))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  const create = async (name: string, id: string, first: Member | null) => {
    if (!supabase || !userId) return null
    try {
      const { error } = await supabase.from('parties').insert({ id, name, owner_id: userId })
      if (error) throw error
      if (first) {
        await supabase.from('party_members').insert({
          party_id: id,
          name: first.name,
          birth: encodeBirth(first.birth),
          added_by: userId,
        })
      }
      await reload()
      return id
    } catch (e) {
      alert(toKoreanError(e, '모임을 만들지 못했어요.'))
      return null
    }
  }

  const remove = async (id: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from('parties').delete().eq('id', id)
      if (error) throw error
      await reload()
    } catch (e) {
      alert(toKoreanError(e, '모임을 삭제하지 못했어요.'))
    }
  }

  return { parties, loading, error, create, remove, reload }
}

/** 내 생일을 서버에도 둔다. 폰↔PC 동기화는 이게 전부다. */
export function useBirthSync(userId: string | null, local: string | null, onRemote: (b: string) => void) {
  useEffect(() => {
    if (!supabase || !userId) return
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('birth')
          .eq('id', userId)
          .maybeSingle()
        if (error) throw error
        if (cancelled) return
        // 서버에 있으면 그걸 따르고, 없으면 이 기기 것을 올려둔다.
        if (data?.birth) onRemote(data.birth)
        else if (local) await supabase.from('profiles').upsert({ id: userId, birth: local })
      } catch (e) {
        toKoreanError(e, '') // 동기화 실패는 조용히 넘어간다. 로컬 값으로 계속 쓴다.
      }
    })()
    return () => {
      cancelled = true
    }
    // local은 최초 1회만 참고한다. 이후 갱신은 아래 push가 맡는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])
}

/** 생일이 바뀌면 서버에 밀어 넣는다. */
export async function pushBirth(userId: string | null, birth: string) {
  if (!supabase || !userId) return
  try {
    await supabase.from('profiles').upsert({ id: userId, birth })
  } catch (e) {
    toKoreanError(e, '')
  }
}
