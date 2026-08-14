import { useCallback, useEffect, useState } from 'react'
import { supabase, toKoreanError, type PartyMemberRow, type PartyRow } from '../supabase'
import { decodeBirth, encodeBirth, type Member } from '../saju'

/** DB의 birth 문자열을 앱이 쓰는 Member로. 못 읽는 행은 버린다. */
function toMember(r: PartyMemberRow): (Member & { rowId: string; addedBy: string | null }) | null {
  const birth = decodeBirth(r.birth)
  return birth ? { name: r.name, birth, rowId: r.id, addedBy: r.added_by } : null
}

export type PartyMember = NonNullable<ReturnType<typeof toMember>>

// 이 기기에서 내가 넣은 참여 기록
// 링크로 그냥 들어간 사람은 서버에 흔적이 안 남는다. 나중에 로그인할 때
// 이 기록으로 자기 행을 찾아 이름표를 붙이고, 그 파티가 내 목록에 뜬다.

const JOINED_KEY = 'oneulun.joined'

type Joined = { party: string; row: string }

function readJoined(): Joined[] {
  try {
    const list = JSON.parse(localStorage.getItem(JOINED_KEY) ?? '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return [] // 손상된 값은 없는 셈 친다. 참여 기록 하나 잃는 것보다 앱이 죽는 게 나쁘다.
  }
}

function rememberJoined(party: string, row: string) {
  const list = readJoined()
  if (list.some((j) => j.row === row)) return
  localStorage.setItem(JOINED_KEY, JSON.stringify([...list, { party, row }]))
}

/** 로그인한 순간, 이 기기에서 넣었던 익명 행들을 내 것으로 가져온다. */
async function claimJoined(userId: string) {
  const rows = readJoined().map((j) => j.row)
  if (!supabase || rows.length === 0) return
  try {
    await supabase.from('party_members').update({ added_by: userId }).in('id', rows).is('added_by', null)
  } catch (e) {
    toKoreanError(e, '') // 실패해도 로컬 기록으로 목록은 뜬다. 조용히 넘어간다.
  }
}

/**
 * 링크로 연 파티 하나. 서버가 진실이고 화면은 구독으로 따라간다.
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
      setError(p.data ? null : '없는 파티예요. 링크가 잘렸거나 삭제됐을 수 있어요.')
    } catch (e) {
      setError(toKoreanError(e, '파티를 불러오지 못했어요.'))
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
      const { data, error } = await supabase
        .from('party_members')
        .insert({
          party_id: partyId,
          name: m.name,
          birth: encodeBirth(m.birth),
          added_by: userId,
        })
        .select('id')
        .single()
      if (error) throw error
      if (data) rememberJoined(partyId, data.id)
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
      alert(toKoreanError(e, '빼지 못했어요. 파티를 만든 사람만 뺄 수 있어요.'))
    }
  }

  /** 파티 이름은 나중에, 필요할 때만 붙인다. parties는 구독하지 않으니 화면은 즉시 반영해둔다. */
  const rename = async (name: string) => {
    if (!supabase || !partyId) return
    setParty((p) => (p ? { ...p, name } : p))
    try {
      const { error } = await supabase.from('parties').update({ name }).eq('id', partyId)
      if (error) throw error
    } catch (e) {
      alert(toKoreanError(e, '이름을 바꾸지 못했어요.'))
    }
  }

  const isOwner = party !== null && userId !== null && party.owner_id === userId

  return { party, members, loading, error, isOwner, add, remove, rename }
}

export type MyParty = PartyRow & { count: number; mine: boolean }

const withCount = (rows: unknown[], mine: boolean): MyParty[] =>
  rows.map((p) => ({
    ...(p as PartyRow),
    count: (p as { party_members?: { count: number }[] }).party_members?.[0]?.count ?? 0,
    mine,
  }))

export function useMyParties(userId: string | null) {
  const [parties, setParties] = useState<MyParty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!supabase || !userId) {
      setParties([])
      return
    }
    setLoading(true)
    const db = supabase
    try {
      // 로그인한 채로 목록을 여는 지금이, 예전에 그냥 참여했던 행에 이름표를 붙일 때다.
      await claimJoined(userId)

      const [owned, joinedRows] = await Promise.all([
        db.from('parties').select('*, party_members(count)').eq('owner_id', userId),
        db.from('party_members').select('party_id').eq('added_by', userId),
      ])
      if (owned.error) throw owned.error
      if (joinedRows.error) throw joinedRows.error

      const mine = withCount(owned.data ?? [], true)
      const mineIds = new Set(mine.map((p) => p.id))
      // 서버에 붙은 참여 기록과 이 기기 기록을 합친다. 내가 만든 파티는 빼고.
      const joinedIds = [
        ...new Set([
          ...((joinedRows.data ?? []) as { party_id: string }[]).map((r) => r.party_id),
          ...readJoined().map((j) => j.party),
        ]),
      ].filter((id) => !mineIds.has(id))

      const joined = joinedIds.length
        ? await db.from('parties').select('*, party_members(count)').in('id', joinedIds)
        : null
      if (joined?.error) throw joined.error

      setParties(
        [...mine, ...withCount(joined?.data ?? [], false)].sort((a, b) =>
          b.created_at.localeCompare(a.created_at),
        ),
      )
      setError(null)
    } catch (e) {
      setError(toKoreanError(e, '파티 목록을 불러오지 못했어요.'))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  const create = async (id: string, first: Member | null) => {
    if (!supabase || !userId) return null
    try {
      const { error } = await supabase.from('parties').insert({ id, owner_id: userId })
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
      alert(toKoreanError(e, '파티를 만들지 못했어요.'))
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
      alert(toKoreanError(e, '파티를 삭제하지 못했어요.'))
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
