import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * 키가 없으면 null. 서버 기능만 빠지고 앱은 그대로 돈다.
 * 설정 전에도 개발이 되고, 배포에서 키가 빠져도 앱이 하얗게 죽지 않는다.
 */
export const supabase = url && key ? createClient(url, key) : null

/** 파티 id는 곧 접근 열쇠다. Math.random은 예측 가능하므로 쓰지 않는다. */
export const newPartyId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16)

/**
 * 링크에서 읽은 파티 id를 16자리 hex로 되돌린다.
 * 공유 시트가 링크 뒤에 공유 문구를 이어붙여 보내는 일이 있어서, 그런 링크도 열려야 한다.
 */
export const cleanPartyId = (raw: string | null | undefined) =>
  raw?.replace(/[^a-f0-9]/gi, '').slice(0, 16) || null

export type PartyRow = {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export type PartyMemberRow = {
  id: string
  party_id: string
  name: string
  birth: string
  added_by: string | null
  created_at: string
}

export function toKoreanError(e: unknown, fallback: string) {
  console.error(e)
  const msg = e instanceof Error ? e.message : String(e)
  if (msg.includes('30명')) return '파티 인원은 30명까지예요.'
  if (msg.includes('Failed to fetch')) return '네트워크가 불안정해요. 잠시 후 다시 시도해주세요.'
  if (msg.includes('row-level security')) return '권한이 없어요. 파티를 만든 사람만 할 수 있어요.'
  return fallback
}
