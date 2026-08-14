import type { Saju, ShiShen } from './saju'

/**
 * 사주 기운을 MBTI 네 축에 대본다. 통계가 아니라 해석이다.
 * 십신을 축마다 양쪽으로 갈라 비율을 내고, 네 축을 곱해 16종의 확률을 만든다.
 *
 * 축을 나눈 기준:
 * - E/I  내보내고 나가서 취하는 기운(식상·재성)과, 안으로 쌓는 기운(인성·비겁).
 *        신강 판정에 쓰는 SELF_SIDE(비겁+인성)가 그대로 안쪽이다. 관성은 사회적 역할이라 뺐다.
 * - S/N  정(正)은 정해진 틀, 편(偏)은 틀 밖으로 뻗는 쪽
 * - T/F  관성·재성은 기준과 계산, 인성·식상은 정과 표현
 * - J/P  질서를 세우는 정(正) 계열과 벌이고 흩는 쪽
 *
 * 양쪽 십신 개수를 반드시 맞춘다. 여덟 글자를 나눠 갖는 구조라 카테고리가 하나 많은 쪽으로
 * 그대로 쏠린다. E쪽만 4개 I쪽 3개로 뒀더니 평균 E가 55.6%, 1위가 E인 사람이 73%였다.
 * 4대4로 맞추면 평균 50%에 E우세 44%로, 실제 한국 MBTI 분포와도 얼추 맞는다.
 */
type Axis = {
  /** [양쪽 글자, 반대쪽 글자] — 자리 순서가 곧 MBTI 표기 순서다 */
  letters: [string, string]
  plus: ShiShen[]
  minus: ShiShen[]
}

const AXES: Axis[] = [
  {
    letters: ['E', 'I'],
    plus: ['食神', '傷官', '偏財', '正財'],
    minus: ['正印', '偏印', '比肩', '劫財'],
  },
  {
    letters: ['S', 'N'],
    plus: ['正印', '正財', '食神', '正官'],
    minus: ['偏印', '偏財', '傷官', '偏官'],
  },
  {
    letters: ['T', 'F'],
    plus: ['正官', '偏官', '正財', '偏財'],
    minus: ['正印', '偏印', '食神', '傷官'],
  },
  {
    letters: ['J', 'P'],
    plus: ['正官', '正財', '正印'],
    minus: ['傷官', '偏財', '劫財'],
  },
]

/** 한쪽이 0이어도 100%가 되면 안 된다. 여덟 글자로 사람을 단정하는 셈이라 양쪽에 한 표씩 깔아둔다. */
const SMOOTH = 1

/**
 * 축마다 양쪽 확률. 16종을 곱으로 만들기 전의 재료이자, 화면에 따로 보여줄 값이다.
 * TOP 3만 보면 확신이 센 축은 세 줄이 다 같은 글자라, 어느 축이 애매한지가 안 보인다.
 */
export function mbtiSides(saju: Saju) {
  return AXES.map((ax) => {
    const count = (list: ShiShen[]) => list.reduce((sum, k) => sum + saju.shishen[k], 0)
    const a = count(ax.plus) + SMOOTH
    const b = count(ax.minus) + SMOOTH
    return [
      { letter: ax.letters[0], p: a / (a + b) },
      { letter: ax.letters[1], p: b / (a + b) },
    ]
  })
}

/** 16종 확률. 합이 1이고 높은 순으로 정렬돼 있다. */
export function mbtiOdds(saju: Saju) {
  const sides = mbtiSides(saju)
  const out: { type: string; p: number }[] = []
  for (const i of sides[0])
    for (const s of sides[1])
      for (const t of sides[2])
        for (const j of sides[3])
          out.push({
            type: i.letter + s.letter + t.letter + j.letter,
            p: i.p * s.p * t.p * j.p,
          })
  return out.sort((x, y) => y.p - x.p)
}
