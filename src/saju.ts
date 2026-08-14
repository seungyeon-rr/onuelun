import { Solar } from 'lunar-javascript'

export const HOUR_UNKNOWN = -1

export type Birth = {
  y: number
  m: number
  d: number
  /** 0~23, 모르면 HOUR_UNKNOWN */
  h: number
}

export const ELEMENTS = ['木', '火', '土', '金', '水'] as const
export type Element = (typeof ELEMENTS)[number]

export const SHISHEN = [
  '比肩', '劫財', '食神', '傷官', '偏財',
  '正財', '偏官', '正官', '偏印', '正印',
] as const
export type ShiShen = (typeof SHISHEN)[number]

export type Saju = {
  /** 년·월·일·시 간지. 시를 모르면 3개 */
  pillars: string[]
  dayGan: Gan
  dayElement: Element
  elements: Record<Element, number>
  /** 팔자에서 뽑은 십신 개수 (일간 자신은 제외) */
  shishen: Record<ShiShen, number>
  /** 신강(일간을 돕는 세력이 절반 이상)이면 true */
  strong: boolean
  hasTime: boolean
}

/** 일간을 돕는 십신. 나머지(식상·재성·관성)는 일간의 힘을 뺀다. */
const SELF_SIDE: ShiShen[] = ['比肩', '劫財', '偏印', '正印']

// 천간 순서가 곧 오행(2개씩)과 음양(짝수=양)을 결정한다.
export const GANS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export type Gan = (typeof GANS)[number]

export const GAN_KO: Record<Gan, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
}

export const ELEMENT_KO: Record<Element, string> = {
  木: '목', 火: '화', 土: '토', 金: '금', 水: '수',
}

export const SHISHEN_KO: Record<ShiShen, string> = {
  比肩: '비견', 劫財: '겁재', 食神: '식신', 傷官: '상관', 偏財: '편재',
  正財: '정재', 偏官: '편관', 正官: '정관', 偏印: '편인', 正印: '정인',
}

// lunar-javascript는 간체자를 쓴다. 우리 표기로 정규화.
const SHISHEN_ALIAS: Record<string, ShiShen> = {
  比肩: '比肩', 劫财: '劫財', 劫財: '劫財',
  食神: '食神', 伤官: '傷官', 傷官: '傷官',
  偏财: '偏財', 偏財: '偏財', 正财: '正財', 正財: '正財',
  七杀: '偏官', 偏官: '偏官', 正官: '正官',
  偏印: '偏印', 正印: '正印',
}

/**
 * 일간(me) 기준으로 상대 천간(other)의 십신을 구한다.
 * 오행 상생 순서(木→火→土→金→水)에서의 거리 + 음양 일치 여부로 결정된다.
 */
export function shishenOf(me: string, other: string): ShiShen {
  const mi = GANS.indexOf(me as Gan)
  const oi = GANS.indexOf(other as Gan)
  if (mi < 0 || oi < 0) throw new Error(`알 수 없는 천간: ${me}, ${other}`)
  const dist = ((oi >> 1) - (mi >> 1) + 5) % 5 // 0:비겁 1:식상 2:재성 3:관성 4:인성
  const sameYinYang = mi % 2 === oi % 2
  return SHISHEN[dist * 2 + (sameYinYang ? 0 : 1)]
}

/** 천간의 오행. 천간 순서상 2개씩 묶인다. */
export function elementOfGan(g: Gan): Element {
  return ELEMENTS[GANS.indexOf(g) >> 1]
}

/** 일간 기준으로 해당 십신이 되는 천간. 십신 10개와 천간 10개가 1:1이라 항상 하나 나온다. */
export function ganOfShiShen(me: Gan, s: ShiShen): Gan {
  return GANS.find((g) => shishenOf(me, g) === s)!
}

export function calcSaju(b: Birth): Saju {
  const hasTime = b.h !== HOUR_UNKNOWN
  // 시를 모를 땐 정오로 계산한 뒤 시주를 통째로 버린다.
  const e = Solar.fromYmdHms(b.y, b.m, b.d, hasTime ? b.h : 12, 0, 0).getLunar().getEightChar()

  const pillars = [e.getYear(), e.getMonth(), e.getDay()]
  if (hasTime) pillars.push(e.getTime())

  const wuxing = [e.getYearWuXing(), e.getMonthWuXing(), e.getDayWuXing()]
  if (hasTime) wuxing.push(e.getTimeWuXing())

  const elements = Object.fromEntries(ELEMENTS.map((x) => [x, 0])) as Record<Element, number>
  for (const ch of wuxing.join('')) {
    if (ELEMENTS.includes(ch as Element)) elements[ch as Element]++
  }

  const raw = [
    e.getYearShiShenGan(),
    e.getMonthShiShenGan(),
    ...(hasTime ? [e.getTimeShiShenGan()] : []),
    ...e.getYearShiShenZhi(),
    ...e.getMonthShiShenZhi(),
    ...e.getDayShiShenZhi(),
    ...(hasTime ? e.getTimeShiShenZhi() : []),
  ]

  const shishen = Object.fromEntries(SHISHEN.map((s) => [s, 0])) as Record<ShiShen, number>
  for (const r of raw) {
    const key = SHISHEN_ALIAS[r]
    if (key) shishen[key]++
  }

  // 신강/신약은 개수가 아니라 자리로 본다. 월지(득령)가 절반 가까운 비중이고,
  // 일지(득지), 나머지 글자들의 세력(득세)이 그다음이다.
  const helps = (s: string) => SELF_SIDE.includes(SHISHEN_ALIAS[s])
  const 득령 = helps(e.getMonthShiShenZhi()[0]) // 지지는 본기(첫 장간)로 본다
  const 득지 = helps(e.getDayShiShenZhi()[0])
  const rest = [
    e.getYearShiShenGan(),
    e.getMonthShiShenGan(),
    e.getYearShiShenZhi()[0],
    ...(hasTime ? [e.getTimeShiShenGan(), e.getTimeShiShenZhi()[0]] : []),
  ]
  const 득세 = rest.filter(helps).length * 2 >= rest.length
  // 월령을 얻으면 그것만으로 신강, 실령했으면 일지와 세력을 둘 다 얻어야 신강.
  // ponytail: 장간은 본기만, 지지 합·충은 안 본다. 실측 분포 신강 47.6%로 한쪽에 쏠리진 않는다.
  const strong = 득령 || (득지 && 득세)

  const dayGan = e.getDayGan() as Gan
  return {
    pillars,
    dayGan,
    dayElement: elementOfGan(dayGan),
    elements,
    shishen,
    strong,
    hasTime,
  }
}

export function ganOfDay(date: Date): string {
  return Solar.fromDate(date).getLunar().getDayInGanZhi()[0]
}

export function todayShiShen(dayGan: string, date: Date): ShiShen {
  return shishenOf(dayGan, ganOfDay(date))
}

// ---- 생일 <-> URL/저장 문자열 (예: "19930512-14", 시 모름은 "19930512-x") ----

export function encodeBirth(b: Birth): string {
  const ymd = `${b.y}${String(b.m).padStart(2, '0')}${String(b.d).padStart(2, '0')}`
  return `${ymd}-${b.h === HOUR_UNKNOWN ? 'x' : b.h}`
}

export function decodeBirth(s: string): Birth | null {
  const m = /^(\d{4})(\d{2})(\d{2})-(x|\d{1,2})$/.exec(s.trim())
  if (!m) return null
  const [, y, mo, d, h] = m
  const birth: Birth = {
    y: +y,
    m: +mo,
    d: +d,
    h: h === 'x' ? HOUR_UNKNOWN : +h,
  }
  // 존재하지 않는 날짜(2월 30일 등)를 걸러낸다.
  const probe = new Date(birth.y, birth.m - 1, birth.d)
  if (probe.getMonth() !== birth.m - 1 || probe.getDate() !== birth.d) return null
  if (birth.h !== HOUR_UNKNOWN && (birth.h < 0 || birth.h > 23)) return null
  return birth
}

// ---- 파티 멤버 <-> URL 문자열 (예: "철수~19930512-14,영희~19950203-9") ----

export type Member = { name: string; birth: Birth }

export function encodeParty(members: Member[]): string {
  return members.map((m) => `${encodeURIComponent(m.name)}~${encodeBirth(m.birth)}`).join(',')
}

export function decodeParty(s: string): Member[] {
  return s
    .split(',')
    .map((chunk) => {
      const [name, code] = chunk.split('~')
      const birth = code ? decodeBirth(code) : null
      return birth ? { name: decodeURIComponent(name) || '이름없음', birth } : null
    })
    .filter((m): m is Member => m !== null)
}

/**
 * 이름 뒤 조사는 받침 유무로 갈린다. josa('가람', '은는') → '가람은'.
 * 짝은 항상 [받침 있을 때, 없을 때] 순서다.
 * ponytail: 한글이 아니면 받침 없음으로 본다. 'Kate는'은 자연스럽고 '민준이'만 맞으면 된다.
 */
export function josa(word: string, pair: '은는' | '이가' | '을를' | '과와'): string {
  const last = word.trim().slice(-1).charCodeAt(0)
  const hangul = last >= 0xac00 && last <= 0xd7a3
  return word + pair[hangul && (last - 0xac00) % 28 !== 0 ? 0 : 1]
}

/** 날짜가 바뀌기 전까지 같은 값을 뽑기 위한 결정론적 해시 (FNV-1a) */
export function seededPick<T>(list: T[], seed: string): T {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return list[(h >>> 0) % list.length]
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
