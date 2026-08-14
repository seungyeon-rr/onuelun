import { describe, it, expect } from 'vitest'
import { calcSaju, type Birth } from './saju'
import { allPairs, assignRoles, percentOf, pickChemi } from './party'

const read = (list: [string, Birth][]) =>
  list.map(([name, birth]) => ({ name, saju: calcSaju(birth) }))

const FIVE = read([
  ['가람', { y: 1993, m: 5, d: 12, h: 14 }],
  ['나은', { y: 1995, m: 12, d: 29, h: -1 }],
  ['다인', { y: 1988, m: 3, d: 3, h: 9 }],
  ['라온', { y: 2001, m: 7, d: 21, h: 20 }],
  ['마루', { y: 1979, m: 11, d: 8, h: -1 }],
])

const names = (pairs: { a: { name: string }; b: { name: string } }[]) =>
  pairs.flatMap((p) => [p.a.name, p.b.name])

describe('케미 고르기', () => {
  it('잘 맞는 쪽과 안 맞는 쪽을 여러 조합으로 준다', () => {
    const { good, bad } = pickChemi(FIVE)
    expect(good.length).toBe(3)
    expect(bad.length).toBeGreaterThan(0)
    expect(good.every((g) => g.percent >= Math.max(...bad.map((b) => b.percent)))).toBe(true)
  })

  // 이름만 다르고 같은 태그·같은 문장이 반복되면 리포트가 복붙처럼 보인다.
  it('같은 태그가 두 번 나오지 않는다', () => {
    const { good, bad } = pickChemi(FIVE)
    const tags = [...good, ...bad].map((p) => p.tag)
    expect(new Set(tags).size).toBe(tags.length)
  })

  it('같은 두 사람이 방향만 바꿔 두 번 나오지 않는다', () => {
    const { good, bad } = pickChemi(FIVE)
    const keys = [...good, ...bad].map((p) => [p.i, p.j].sort().join('-'))
    expect(new Set(keys).size).toBe(keys.length)
  })

  // 파티원이 바뀌었는데 리포트가 그대로면 안 된다.
  it('멤버를 빼면 그 사람이 리포트에서 사라진다', () => {
    const { good, bad } = pickChemi(FIVE)
    const gone = names([...good, ...bad])[0]
    const left = pickChemi(FIVE.filter((r) => r.name !== gone))
    expect(names([...left.good, ...left.bad])).not.toContain(gone)
  })

  it('2명이면 한 조합만 나온다', () => {
    const { good, bad } = pickChemi(FIVE.slice(0, 2))
    expect(good.length + bad.length).toBe(1)
  })
})

describe('궁합 점수', () => {
  // 한 방향만 보면 "쟤는 날 좋아하는데 나는 아닌" 사이가 만점으로 나온다.
  it('누구를 먼저 놓든 같은 점수가 나온다', () => {
    const [a, b] = FIVE
    expect(percentOf(a, b)).toBe(percentOf(b, a))
  })

  it('모든 조합을 한 번씩만 준다', () => {
    const pairs = allPairs(FIVE)
    expect(pairs.length).toBe((5 * 4) / 2)
    const keys = pairs.map((p) => [p.a.name, p.b.name].sort().join('-'))
    expect(new Set(keys).size).toBe(keys.length)
    expect(pairs.map((p) => p.percent)).toEqual([...pairs.map((p) => p.percent)].sort((a, b) => b - a))
  })

  it('모든 조합이 0~100 안에 든다', () => {
    const all = FIVE.flatMap((a) => FIVE.map((b) => percentOf(a, b)))
    expect(all.every((p) => p >= 0 && p <= 100)).toBe(true)
  })
})

describe('역할 배정', () => {
  it('모임 안에서 역할이 겹치지 않는다', () => {
    const roles = assignRoles(FIVE).map((r) => r.role)
    expect(new Set(roles).size).toBe(roles.length)
  })

  it('생일이 같은 두 사람도 다른 역할을 받는다', () => {
    const twins = read([
      ['첫째', { y: 1993, m: 5, d: 12, h: 14 }],
      ['둘째', { y: 1993, m: 5, d: 12, h: 14 }],
    ])
    const [a, b] = assignRoles(twins)
    expect(a.role).not.toBe(b.role)
  })
})
