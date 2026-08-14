import type { Element } from './saju'

/** 회갈색 램킨. 이 앱의 심볼이자 기본 모습이다. */
export const MASCOT_COLOR = '#A2948B'

/**
 * 26x21 도트 스프라이트. 자세별로 한 장씩, 털색(c)·무늬색(d)·홍채(y)만 갈아끼운다.
 * o=외곽 c=몸털 d=무늬 w=흰털 p=귀분홍 n=코 e=눈동자 y=홍채 h=하이라이트
 */
export const SPRITES = {
  /** 앉기 */
  sit: [
    '..oo......oo..............',
    '..oco....oco..............',
    '..ocpoooopco..............',
    '.occcccccccco.............',
    '.occdcddcdcco.............',
    '.occhyccyhcco.............',
    '.occyecceycco.............',
    '.occcwnnwccco.............',
    '.occcwoowccco.............',
    '.occcwwwwccco.............',
    '..occcccccco..............',
    '.ocooooooooco.............',
    '.occcccccccco.....oo......',
    'occdccccccdcco...occo.....',
    'occcwwwwwwccco...occo.....',
    'occdwwwwwwdcco...oddo.....',
    'occcwwwwwwccco...occo.....',
    'occdwwwwwwdcco...occo.....',
    'occwwwwwwwwccooooocco.....',
    'ocwwwwowwwwccocccccco.....',
    '.oooooooooooooooooooo.....',
  ],
  /** 서기 */
  stand: [
    '.oo......oo...............',
    '.oco....oco...............',
    '.ocpoooopco...............',
    'occcccccccco..........oo..',
    'occdcddcdcco.........occo.',
    'occhyccyhcco.........occo.',
    'occyecceycco.........oddo.',
    'occcwnnwccco.........occo.',
    'occcwoowcccooooooooooocco.',
    'occcwwwwcccccccccccccccco.',
    '.occcccccccccccccccccccco.',
    '..oooooooocccccccccccccco.',
    '..........occcdccdccdccco.',
    '..........occcdccdccdccco.',
    '..........occcdccdccdccco.',
    '..........ocwwwwwwwwwwwco.',
    '..........occcoooooooccco.',
    '..........owwwo.....owwwo.',
    '..........owwwo.....owwwo.',
    '..........owwwo.....owwwo.',
    '..........ooooo.....ooooo.',
  ],
  /** 식빵 굽기 */
  loaf: [
    '..........................',
    '..........................',
    '.......oo......oo.........',
    '.......oco....oco.........',
    '.......ocpoooopco.........',
    '......occcccccccco........',
    '......occdcddcdcco........',
    '......occhyccyhcco........',
    '......occyecceycco........',
    '......occcwnnwccco........',
    '......occcwoowccco........',
    '......occcwwwwccco........',
    '.......occcccccco.........',
    '.....occoooooooocco.......',
    '....ocddddccccccccco......',
    '...ocdddddccccccddddco....',
    '..ocdddddcccccccdddddco...',
    '..occccccccccccccddddco...',
    '..occccccccccccccccccco...',
    '..occcccwwwowwwccccccco...',
    '..ooooooooooooooooooooo...',
  ],
  /** 복슬복슬 앉기 */
  fluff: [
    '.......oo......oo.........',
    '.......oco....oco.........',
    '.......ocpoooopco.........',
    '......occcccccccco........',
    '......occdcddcdcco........',
    '......occhyccyhcco........',
    '......occyecceycco........',
    '......occcwnnwccco........',
    '......occcwoowccco........',
    '......occcwwwwccco........',
    '.......occcccccco.........',
    '.....occoooooooocco.......',
    '....occcccccccccccco......',
    '...occccccccccccccco......',
    '..occccwwwwwwwwcccco..oo..',
    '..occdcwwwwwwwwcdcco.occo.',
    '..occccwwwwwwwwccccoocccco',
    '..occcwwwwwwwwwwcccoocdcco',
    '..occwwwwwwwwwwwwccoocccco',
    '..occccwwwowwwcccccocccco.',
    '..ooooooooooooooooooooooo.',
  ],
  /** 눕기 */
  lie: [
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '.oo......oo...............',
    '.oco....oco...............',
    '.ocpoooopco...............',
    'occcccccccco..............',
    'occdcddcdcco..............',
    'occhyccyhcco...ooooo......',
    'occyecceycco..occccco.....',
    'occcwnnwccco.occccccco.oo.',
    'occcwoowccccccccccccccocco',
    'occcwwwwccccccdccdccccocco',
    '.occccccccccccccccccccoddo',
    '..ooooooooccccdccdccccocco',
    '.occccccccccccccccccccccco',
    '.owwwwwwwcccccccccccccoooo',
    '.ooooooooooooooooooooooooo',
  ],
}

/** 자세도 무늬도 오행마다 다르다. c=털 d=얼룩 y=홍채 */
export const COATS: Record<
  Element,
  { pose: keyof typeof SPRITES; c: string; d: string; y: string }
> = {
  木: { pose: 'stand', c: '#7FBFA6', d: '#35735E', y: '#4FB58B' }, // 고등어
  火: { pose: 'sit', c: '#FFA98E', d: '#E2664F', y: '#C98A1E' }, // 치즈
  土: { pose: 'loaf', c: '#F2B544', d: '#4A4038', y: '#5FA07A' }, // 삼색이
  金: { pose: 'fluff', c: '#D8D3CA', d: '#ADA69A', y: '#6B96DE' }, // 페르시안
  水: { pose: 'lie', c: '#3A4560', d: '#28304A', y: '#E2A93B' }, // 검정
}

export const MASCOT = { pose: 'sit', c: MASCOT_COLOR, d: '#8B7D73', y: '#C5BE55' } as const

/** 고양이가 달라져도 안 변하는 색. */
export const PIXEL: Record<string, string> = {
  o: '#3E362F', w: '#FDFBF9', p: '#E8B4AE', e: '#3E362F',
  h: '#FFFFFF', n: '#E8918C',
}

/** 오행 표식 3x3. 등 위에 떠 있다. */
export const TOPPER: Record<Element, { rows: string[]; color: string; alt?: string }> = {
  木: { rows: ['.gg', 'gga', '.a.'], color: '#4FB58B', alt: '#2E8563' },
  火: { rows: ['.g.', 'ggg', '.g.'], color: '#D4483A' },
  土: { rows: ['...', '.gg', 'gggg'], color: '#C98A1E' },
  金: { rows: ['.g.', 'ggg', '.g.'], color: '#8A8377' },
  水: { rows: ['.g.', 'ggg', 'gg.'], color: '#3F66AC' },
}
