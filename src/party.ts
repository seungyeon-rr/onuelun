import { calcSaju, shishenOf, type ShiShen } from './saju'
import { PAIR_CHEMI, PARTY_ROLE } from './data'

export type Read = { name: string; saju: ReturnType<typeof calcSaju> }
export type Pair = { i: number; j: number; a: Read; b: Read } & (typeof PAIR_CHEMI)[ShiShen]

/**
 * 이미 두 자리 다 찬 조합은 건너뛴다. 같은 사람만 계속 나오면 리포트가 심심해진다.
 * 태그도 한 번씩만 쓴다. 같은 '먹부림 듀오'가 이름만 바뀐 채 두 번 뜨면 복붙으로 보인다.
 */
function greedy(ranked: Pair[], take: number, tags: Set<string>) {
  const used = new Set<number>()
  const out: Pair[] = []
  for (const p of ranked) {
    if (out.length >= take) break
    if (used.has(p.i) && used.has(p.j)) continue
    if (tags.has(p.tag)) continue
    tags.add(p.tag)
    used.add(p.i)
    used.add(p.j)
    out.push(p)
  }
  return out
}

/**
 * 잘 맞는 쪽 위에서 몇 개, 안 맞는 쪽 아래에서 몇 개.
 * A가 B를 보는 십신과 B가 A를 보는 십신이 달라서 방향까지 다 훑되, 같은 두 사람은 한 번만 쓴다.
 * ponytail: 30명이어도 870쌍이라 전수로 돈다. 더 커지면 그때 자르면 된다.
 */
export function pickChemi(read: Read[], take = 3) {
  const seen = new Set<string>()
  const ranked = read
    .flatMap((a, i) =>
      read.map((b, j) => ({ i, j, a, b, ...PAIR_CHEMI[shishenOf(a.saju.dayGan, b.saju.dayGan)] })),
    )
    .filter((p) => p.i !== p.j)
    .sort((x, y) => y.score - x.score)
    .filter((p) => {
      const key = `${Math.min(p.i, p.j)}-${Math.max(p.i, p.j)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  const tags = new Set<string>()
  const good = greedy(ranked, take, tags)
  const rest = ranked.filter((p) => !good.includes(p))
  return { good, bad: greedy(rest.reverse(), take, tags) }
}

/**
 * 역할은 모임 안에서 안 겹치게 준다. 일간이 같아도 신강/신약이 다르면 다른 역할이 먼저 잡힌다.
 * ponytail: 20종을 다 쓰면 그때부터는 겹친다. 30명 상한이라 최악이 열 명 중복이다.
 */
export function assignRoles(read: Read[]) {
  const used = new Set<string>()
  return read.map(({ saju }) => {
    const card = PARTY_ROLE[saju.dayGan]
    const [first, second] = saju.strong ? [card.strong, card.weak] : [card.weak, card.strong]
    const pick = used.has(first.role) && !used.has(second.role) ? second : first
    used.add(pick.role)
    return pick
  })
}
