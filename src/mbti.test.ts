import { describe, it, expect } from 'vitest'
import { calcSaju, type Birth } from './saju'
import { mbtiOdds } from './mbti'

const BIRTHS: Birth[] = [
  { y: 1993, m: 5, d: 12, h: 14 },
  { y: 1995, m: 12, d: 29, h: -1 },
  { y: 1988, m: 3, d: 3, h: 9 },
  { y: 2001, m: 7, d: 21, h: 20 },
]

describe('MBTI 확률', () => {
  it('16종이 다 나오고 합이 1이다', () => {
    for (const b of BIRTHS) {
      const odds = mbtiOdds(calcSaju(b))
      expect(odds.length).toBe(16)
      expect(new Set(odds.map((o) => o.type)).size).toBe(16)
      expect(odds.reduce((s, o) => s + o.p, 0)).toBeCloseTo(1)
    }
  })

  it('높은 순으로 정렬돼 있다', () => {
    const odds = mbtiOdds(calcSaju(BIRTHS[0]))
    expect(odds.map((o) => o.p)).toEqual([...odds.map((o) => o.p)].sort((a, b) => b - a))
  })

  // 한쪽 십신이 0이어도 반대쪽이 100%가 되면 안 된다. 여덟 글자로 단정할 일이 아니다.
  it('어떤 유형도 0%나 100%가 아니다', () => {
    for (const b of BIRTHS) {
      expect(mbtiOdds(calcSaju(b)).every((o) => o.p > 0 && o.p < 1)).toBe(true)
    }
  })
})
