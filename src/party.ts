import { calcSaju, shishenOf, type ShiShen } from './saju'
import { PAIR_CHEMI, PARTY_ROLE } from './data'

export type Read = { name: string; saju: ReturnType<typeof calcSaju> }
export type Pair = { i: number; j: number; a: Read; b: Read; percent: number } & (typeof PAIR_CHEMI)[ShiShen]

/**
 * 십신은 늘 짝으로 맞물려서(食神↔偏印처럼) 양방향 평균이 2~7.5 안에서만 논다.
 * 그대로 100을 곱하면 아무도 90점을 못 받고 점수도 여섯 종류뿐이라, 실제 범위를 다시 편다.
 */
const RAW = { min: 2, max: 7.5 }
const SCALE = { min: 30, max: 95 }
/** 신강·신약이 엇갈리면 서로 모자란 쪽을 채운다. 같으면 그만큼 뺀다. */
const STRENGTH_FIT = 4

/**
 * 100점 만점 궁합. 양쪽 점수를 평균한다.
 * A가 B를 보는 십신과 B가 A를 보는 십신이 달라서, 한쪽만 보면 짝사랑도 만점이 나온다.
 */
export function percentOf(a: Read, b: Read) {
  const one = (x: Read, y: Read) => PAIR_CHEMI[shishenOf(x.saju.dayGan, y.saju.dayGan)].score
  const avg = (one(a, b) + one(b, a)) / 2
  const fit = a.saju.strong === b.saju.strong ? -STRENGTH_FIT : STRENGTH_FIT
  const spread = ((avg - RAW.min) / (RAW.max - RAW.min)) * (SCALE.max - SCALE.min)
  return Math.round(SCALE.min + spread) + fit
}

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
      read.map((b, j) => ({
        i, j, a, b,
        percent: percentOf(a, b),
        ...PAIR_CHEMI[shishenOf(a.saju.dayGan, b.saju.dayGan)],
      })),
    )
    .filter((p) => p.i !== p.j)
    // 점수는 양방향이 같으니, 같은 값이면 더 잘 어울리는 쪽 문장을 남긴다.
    .sort((x, y) => y.percent - x.percent || y.score - x.score)
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
