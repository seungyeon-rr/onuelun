import { Solar } from 'lunar-javascript'

/** 태어난 시를 모르는 경우 */
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
  /** 일간 (甲~癸) */
  dayGan: string
  /** 일간의 오행 */
  dayElement: Element
  /** 팔자 전체 오행 개수 */
  elements: Record<Element, number>
  /** 팔자에서 뽑은 십신 개수 (일간 자신은 제외) */
  shishen: Record<ShiShen, number>
  hasTime: boolean
}

// 천간 순서가 곧 오행(2개씩)과 음양(짝수=양)을 결정한다.
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

export const GAN_KO: Record<string, string> = {
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
  const mi = GAN.indexOf(me)
  const oi = GAN.indexOf(other)
  if (mi < 0 || oi < 0) throw new Error(`알 수 없는 천간: ${me}, ${other}`)
  const dist = ((oi >> 1) - (mi >> 1) + 5) % 5 // 0:비겁 1:식상 2:재성 3:관성 4:인성
  const sameYinYang = mi % 2 === oi % 2
  return SHISHEN[dist * 2 + (sameYinYang ? 0 : 1)]
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

  const dayGan = e.getDayGan()
  return {
    pillars,
    dayGan,
    dayElement: ELEMENTS[GAN.indexOf(dayGan) >> 1],
    elements,
    shishen,
    hasTime,
  }
}

/** 해당 날짜의 일간 */
export function ganOfDay(date: Date): string {
  return Solar.fromDate(date).getLunar().getDayInGanZhi()[0]
}

/** 오늘 나에게 들어오는 십신 */
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
