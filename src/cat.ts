import type { Element } from './saju'

/** 우리 고양이 회색. 이 앱의 심볼 — 오행 고양이들과 달리 몸통 없이 얼굴만이다. */
export const MASCOT_COLOR = '#A6A19B'

/**
 * 26x21 도트 스프라이트. 자세별로 한 장씩, 털색(c)·무늬색(d)·홍채(y)만 갈아끼운다.
 * 머리 16x16, 몸통 5줄. 얼굴 무늬는 자세별 스프라이트에 직접 박아 넣는다(자세는 오행마다 하나씩이라 겹치지 않는다).
 * o=외곽 c=몸털 d=무늬 k=검정얼룩 w=흰털 p=귀·볼분홍 n=코 y=눈 h=하이라이트
 */
export const SPRITES = {
  /** 심볼 전용 · 우리 고양이 얼굴 (몸통 없음) */
  face: [
    '..........................',
    '..........................',
    '.....oo...........oo......',
    '.....oco.........oco......',
    '.....ocpo.......opco......',
    '.....ocpooooooooopco......',
    '.....occccccccccccco......',
    '....occccccccccccccco.....',
    '....occccccccccccccco.....',
    '....occccccccccccccco.....',
    '....occchycccccyhccco.....',
    '..ooocccyycccccyycccooo...',
    '....ocpcyywwwwwyycpco.....',
    '..ooocccppwwowwppcccooo...',
    '....occwwwwowowwwwcco.....',
    '.....ocwwwwwwwwwwwco......',
    '......ocwwwwwwwwwco.......',
    '.......ooooooooooo........',
    '..........................',
    '..........................',
    '..........................',
  ],
  /** 앉기 · 치즈 */
  sit: [
    '....oo..........oo........',
    '....oco........oco........',
    '....ocpo......opco........',
    '....ocpoooooooopco........',
    '....occcccccccccco........',
    '...occcdccddccdccco.......',
    '...occcdccddccdccco.......',
    '...occccdccccdcccco.......',
    '...occchyccccyhccco.......',
    '...ocdcyyccccyycdco.......',
    '...ocdcyywwwwyycdco.......',
    '...occcwwwnnwwwccco.......',
    '...occwwwwoowwwwcco.......',
    '...occwwwwwwwwwwcco.......',
    '....ocwwwwwwwwwwco........',
    '.....oooooooooooo.........',
    '.......ocdcccco...........',
    '.....ocdcwwwwcdco..oo.....',
    '.....occwwwwwwcco.occo....',
    '.....occwwwowwwcocccco....',
    '.....ooooooooooooooooo....',
  ],
  /** 서기 · 고등어 */
  stand: [
    '....oo..........oo........',
    '....oco........oco........',
    '....ocpo......opco........',
    '....ocpoooooooopco........',
    '....occcccccccccco........',
    '...occcdccddccdccco.......',
    '...occcdccddccdccco.......',
    '...occccdccccdcccco.......',
    '...occchyccccyhccco.......',
    '...ocdcyyccccyycdco.......',
    '...ocdcyywwwwyycdco.......',
    '...occcwwwnnwwwccco.......',
    '...occwwwwoowwwwcco.oo....',
    '...occwwwwwwwwwwccoocco...',
    '....ocwwwwwwwwwwco.oddo...',
    '.....oooooooooooo..occo...',
    '......ocdcwwwcdco..oddo...',
    '.....ocdccwwwccdco.occo...',
    '.....ocdcooooocdcooccco...',
    '.....owwwo...owwwocccco...',
    '.....ooooo...oooooooooo...',
  ],
  /** 식빵 굽기 · 삼색이 */
  loaf: [
    '......oo..........oo......',
    '......odo........oko......',
    '......odpo......opko......',
    '......odpoooooooopko......',
    '......odddcccccckkko......',
    '.....oddddcccccckkkko.....',
    '.....odddcccccccckkko.....',
    '.....oddcccccccccckko.....',
    '.....oddchyccccyhckko.....',
    '.....oddcyyccccyyckko.....',
    '.....oddcyywwwwyyckko.....',
    '.....occcwwwnnwwwccco.....',
    '.....occwwwwoowwwwcco.....',
    '.....occwwwwwwwwwwcco.....',
    '......ocwwwwwwwwwwco......',
    '.......oooooooooooo.......',
    '........occccddddo........',
    '......occcddddkkkcco......',
    '......occccdddkkkcco......',
    '......occcwwwowwwcco......',
    '......oooooooooooooo......',
  ],
  /** 복슬복슬 앉기 */
  fluff: [
    '.....oo..........oo.......',
    '.....oco........oco.......',
    '.....ocpo......opco.......',
    '.....ocpoooooooopco.......',
    '.....occcccccccccco.......',
    '....occcccccccccccco......',
    '....occcccccccccccco......',
    '....occcccccccccccco......',
    '....occchyccccyhccco......',
    '....occcyyccccyyccco......',
    '....ocpcyywwwwyycpco......',
    '....occcwwwnnwwwccco......',
    '....occwwwwoowwwwcco......',
    '....occwwwwwwwwwwcco......',
    '.....ocwwwwwwwwwwco.......',
    '......oooooooooooo........',
    '.......occcccccco.........',
    '.....occccccccccco...oo...',
    '....occwwwwwwwwwcco.occco.',
    '....occcwwwowwwcccoccccco.',
    '....ooooooooooooooooooooo.',
  ],
  /** 눕기 */
  lie: [
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '.oo..........oo...........',
    '.oco........oco...........',
    '.ocpo......opco...........',
    '.ocpoooooooopco...........',
    '.occcccccccccco...........',
    'occcccccccccccco..........',
    'occcccccccccccco..........',
    'occcccccccccccco..........',
    'occchyccccyhccco..........',
    'occcyyccccyyccco..........',
    'ocpcyywwwwyycpco..........',
    'occcwwwnnwwwccco.ooooo....',
    'occwwwwoowwwwccooccccco...',
    'occwwwwwwwwwwccccccccco...',
    '.ocwwwwwwwwwwcccccdcccoooo',
    '..oooooooooooocccccccccccc',
    '..oooooooooooooooooooooooo',
  ],
}

/** 자세 + 털색(c) · 무늬색(d) · 검정얼룩(k, 삼색이만) · 눈색(y). */
export type Coat = { pose: keyof typeof SPRITES; c: string; d: string; y: string; k?: string }

export const COATS: Record<Element, Coat> = {
  木: { pose: 'stand', c: '#98865F', d: '#37301F', y: '#8FD13A' }, // 고등어
  火: { pose: 'sit', c: '#E2A468', d: '#BE6F33', y: '#3D9E52' }, // 치즈
  土: { pose: 'loaf', c: '#FBF7EF', d: '#E08A3C', y: '#7CB342', k: '#2E2A26' }, // 삼색이
  金: { pose: 'lie', c: '#3A4560', d: '#28304A', y: '#FFC02E' }, // 검정
  水: { pose: 'fluff', c: '#F2EDE2', d: '#DCD3C2', y: '#3E7BD6' }, // 하얀 고양이
}

export const MASCOT: Coat = { pose: 'face', c: MASCOT_COLOR, d: '#8A857E', y: '#9A8F2E' }

/** 고양이가 달라져도 안 변하는 색. */
export const PIXEL: Record<string, string> = {
  o: '#3E362F', w: '#FDFBF9', p: '#E8B4AE', e: '#3E362F',
  h: '#FFFFFF', n: '#E8918C',
}

/** 오행 표식. 모양은 다 같은 십자, 색만 다르다. */
export const MARK = ['.g.', 'ggg', '.g.']

export const MARK_COLOR: Record<Element, string> = {
  木: '#4FB58B', 火: '#D4483A', 土: '#C98A1E', 金: '#8A8377', 水: '#3F66AC',
}
