import { describe, it, expect } from 'vitest'
import { drawCard, wrapText, LAYOUT, type CardArt } from './cardImage'
import { GAN_META, RARITY, rarityRank } from './data'
import { GANS, ganOfShiShen, elementOfGan, GAN_KO, ELEMENT_KO, type Gan } from './saju'

const W = 900
const H = 1200

/**
 * 캔버스 없이 배치만 검사한다. 한글은 폰트 크기만큼 폭을 먹는다고 보면
 * 실제보다 넉넉하게 잡히니, 여기서 안 넘치면 브라우저에서도 안 넘친다.
 */
function fakeCtx() {
  const drawn: { x: number; y: number; w: number; h: number; text?: string }[] = []
  const ctx = {
    font: '10px sans-serif',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    textAlign: 'left',
    measureText(s: string) {
      const size = parseInt(this.font, 10)
      // 한글 한 글자 = 1em, 공백·숫자·괄호는 절반으로 친다
      const width = [...s].reduce((sum, ch) => sum + (/[가-힣]/.test(ch) ? size : size * 0.5), 0)
      return { width }
    },
    fillText(s: string, x: number, y: number) {
      const w = this.measureText(s).width
      const size = parseInt(this.font, 10)
      const left = this.textAlign === 'center' ? x - w / 2 : x
      drawn.push({ x: left, y: y - size, w, h: size, text: s })
    },
    fillRect(x: number, y: number, w: number, h: number) {
      drawn.push({ x, y, w, h })
    },
    strokeRect(x: number, y: number, w: number, h: number) {
      drawn.push({ x, y, w, h })
    },
  }
  return { ctx, drawn }
}

const ganName = (g: Gan) => `${GAN_KO[g]}${ELEMENT_KO[elementOfGan(g)]}(${g})`

/** 화면에서 쓰는 것과 같은 규칙으로 카드 20종(일간 10 × 신강/신약)을 만든다. */
function everyCard(): CardArt[] {
  return GANS.flatMap((g) =>
    [true, false].map((strong) => {
      const best = ganOfShiShen(g, strong ? '正官' : '正印')
      const worst = ganOfShiShen(g, strong ? '劫財' : '偏官')
      return {
        el: elementOfGan(g),
        rarity: `100명 중 ${Math.round(RARITY[g][strong ? 'strong' : 'weak'])}명꼴`,
        rarityNote: `20종 중 ${rarityRank(RARITY[g][strong ? 'strong' : 'weak'])}번째로 드문 유형`,
        character: GAN_META[g].character,
        traits: GAN_META[g].traits,
        best: { label: ganName(best), character: GAN_META[best].character },
        worst: { label: ganName(worst), character: GAN_META[worst].character },
      }
    }),
  )
}

describe('카드 이미지', () => {
  it('긴 줄은 폭에 맞춰 접는다', () => {
    const measure = (s: string) => s.length
    expect(wrapText('가나다 라마바', 3, measure)).toEqual(['가나다', '라마바'])
    // 띄어쓰기 없이 긴 덩어리는 글자 단위로 잘린다
    expect(wrapText('가나다라마바', 2, measure)).toEqual(['가나', '다라', '마바'])
    expect(wrapText('짧다', 100, measure)).toEqual(['짧다'])
  })

  it('카드 20종 전부 테두리 안에 들어온다', () => {
    for (const art of everyCard()) {
      const { ctx, drawn } = fakeCtx()
      drawCard(ctx as unknown as CanvasRenderingContext2D, art, 'oneulun.pages.dev')
      for (const box of drawn) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.y).toBeGreaterThanOrEqual(0)
        expect(box.x + box.w).toBeLessThanOrEqual(W)
        expect(box.y + box.h).toBeLessThanOrEqual(H)
      }
    }
  })

  it('글자가 고양이 위로 올라타지 않는다', () => {
    const { x, y, w, h } = LAYOUT.sprite
    for (const art of everyCard()) {
      const { ctx, drawn } = fakeCtx()
      drawCard(ctx as unknown as CanvasRenderingContext2D, art, 'oneulun.pages.dev')
      for (const t of drawn.filter((b) => b.text !== undefined)) {
        const hit = t.x < x + w && t.x + t.w > x && t.y < y + h && t.y + t.h > y
        expect(hit, `"${t.text}"가 고양이를 덮는다`).toBe(false)
      }
    }
  })

  it('캐릭터 설명이 찰떡·상극 판을 침범하지 않는다', () => {
    const BOX_TOP = LAYOUT.boxTop
    for (const art of everyCard()) {
      const { ctx, drawn } = fakeCtx()
      drawCard(ctx as unknown as CanvasRenderingContext2D, art, 'oneulun.pages.dev')
      // 배경·테두리는 원래 카드 전체를 덮는다. 글자만 본다.
      const texts = drawn.filter((b) => b.text !== undefined)
      // 판 위 글자는 판에 닿기 전에 끝나고, 판 안 글자는 판 안에서 시작한다.
      for (const t of texts) {
        expect(t.y + t.h <= BOX_TOP || t.y >= BOX_TOP).toBe(true)
      }
      const inside = texts.filter((t) => t.y >= BOX_TOP)
      expect(inside.length).toBeGreaterThanOrEqual(4) // 찰떡·상극 각각 라벨 + 캐릭터명
    }
  })
})
