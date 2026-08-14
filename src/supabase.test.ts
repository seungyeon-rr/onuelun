import { describe, it, expect } from 'vitest'
import { cleanPartyId } from './supabase'

describe('모임 id 정제', () => {
  it('멀쩡한 id는 그대로 둔다', () => {
    expect(cleanPartyId('d4e47ea8dadb407f')).toBe('d4e47ea8dadb407f')
  })

  // 실제로 터진 버그. 공유 시트가 링크 뒤에 문구를 붙여서 id에 들러붙었다.
  it('링크 뒤에 붙은 공유 문구를 떼어낸다', () => {
    expect(cleanPartyId('d4e47ea8dadb407f 우리 모임 기운 밸런스 보자')).toBe('d4e47ea8dadb407f')
  })

  it('영문 문구가 붙어도 16자리까지만 쓴다', () => {
    expect(cleanPartyId('d4e47ea8dadb407f see our balance')).toBe('d4e47ea8dadb407f')
  })

  it('없거나 빈 값은 null', () => {
    expect(cleanPartyId(null)).toBeNull()
    expect(cleanPartyId('우리 모임')).toBeNull()
  })
})
