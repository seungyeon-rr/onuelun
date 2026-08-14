import { COATS, MARK, MARK_COLOR, PIXEL, SPRITES } from './cat'
import type { Element } from './saju'

/**
 * 내 카드를 이미지 한 장으로 굽는다.
 * 화면을 그대로 찍지 않고 다시 그린다. 캡처 라이브러리를 안 쓰는 대신,
 * 남한테 보낼 때 필요한 것만 크게 담는다 — 고양이·유형·캐릭터명·찰떡/상극.
 */
export type CardArt = {
  el: Element
  /** '신강 신금(辛)' */
  type: string
  /** '꺾일지언정 안 굽는 대장나무' */
  character: string
  traits: string
  best: { label: string; character: string }
  worst: { label: string; character: string }
}

const W = 900
const H = 1200
const PAD = 60

const INK = '#3E362F'
const INK_SOFT = '#7D7168'
const INK_FAINT = '#B6A99E'
const SEAL = '#E5533D'
const HANJI = '#FFF3E6'
const CARD = '#FFFDF8'

const display = (px: number) => `${px}px RomanticGumi, Pretendard, sans-serif`
const body = (px: number) => `${px}px Pretendard, -apple-system, sans-serif`

/**
 * 글자를 폭에 맞춰 자른다. 한국어는 띄어쓰기가 드물어 어절만으로는 안 맞을 때가 있어
 * 한 어절이 통째로 넘치면 글자 단위로 다시 자른다.
 * measure를 밖에서 받는 건 캔버스 없이 테스트하기 위해서다.
 */
export function wrapText(text: string, max: number, measure: (s: string) => number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (measure(next) <= max) {
      line = next
      continue
    }
    if (line) lines.push(line)
    line = word
    while (measure(line) > max) {
      let cut = 1
      while (cut < line.length && measure(line.slice(0, cut + 1)) <= max) cut++
      lines.push(line.slice(0, cut))
      line = line.slice(cut)
    }
  }
  if (line) lines.push(line)
  return lines
}

function sprite(ctx: CanvasRenderingContext2D, el: Element, x: number, y: number, px: number) {
  const coat = COATS[el]
  const palette: Record<string, string> = {
    ...PIXEL,
    c: coat.c,
    d: coat.d,
    y: coat.y,
    k: coat.k ?? coat.d,
  }
  const paint = (rows: string[], ox: number, oy: number, color?: string) => {
    rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch === '.') return
        ctx.fillStyle = color ?? palette[ch] ?? INK
        ctx.fillRect(x + (ox + rx) * px, y + (oy + ry) * px, px, px)
      }),
    )
  }
  paint(SPRITES[coat.pose], 0, 0)
  paint(MARK, 22, 0, MARK_COLOR[el])
}

/** 도트 UI의 판때기. 테두리 굵고 그림자는 각지게. */
function plate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = INK
  ctx.fillRect(x + 8, y + 8, w, h)
  ctx.fillStyle = fill
  ctx.fillRect(x, y, w, h)
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6)
}

function centered(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, color: string, max = W - PAD * 2) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  const lines = wrapText(text, max, (s) => ctx.measureText(s).width)
  const step = parseInt(font, 10) * 1.35
  lines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * step))
  return y + lines.length * step
}

/** host는 밖에서 받는다. 그래야 이 함수가 브라우저 없이도 돌고, 배치를 테스트로 잡을 수 있다. */
export function drawCard(ctx: CanvasRenderingContext2D, art: CardArt, host: string) {
  ctx.fillStyle = HANJI
  ctx.fillRect(0, 0, W, H)
  ctx.lineWidth = 12
  ctx.strokeStyle = INK
  ctx.strokeRect(20, 20, W - 40, H - 40)

  ctx.textAlign = 'center'
  ctx.font = body(26)
  ctx.fillStyle = INK_FAINT
  ctx.fillText('오늘운 · 사주로 보는 오늘의 나', W / 2, 110)

  centered(ctx, art.type, 190, display(52), INK)

  // 26x21 스프라이트. 폭이 화면을 넘지 않는 선에서 최대한 크게.
  const px = 20
  sprite(ctx, art.el, (W - 26 * px) / 2, 230, px)

  // 캐릭터명과 traits는 길이에 따라 두 줄까지 늘어난다. 아래로 흐르게 두고,
  // 찰떡/상극 판은 바닥에 붙여서 둘이 만나지 않게 한다.
  const y = centered(ctx, art.character, 700, display(46), SEAL)
  centered(ctx, art.traits, y + 20, body(28), INK_SOFT)

  const boxW = (W - PAD * 2 - 24) / 2
  const boxH = 170
  const boxY = H - 90 - boxH
  ;[
    { x: PAD, tag: '찰떡', data: art.best, color: INK },
    { x: PAD + boxW + 24, tag: '상극', data: art.worst, color: SEAL },
  ].forEach(({ x, tag, data, color }) => {
    plate(ctx, x, boxY, boxW, boxH, CARD)
    ctx.textAlign = 'center'
    const mid = x + boxW / 2
    ctx.font = body(24)
    ctx.fillStyle = color
    ctx.fillText(`${tag} · ${data.label}`, mid, boxY + 46)
    ctx.font = display(28)
    ctx.fillStyle = INK
    wrapText(data.character, boxW - 40, (s) => ctx.measureText(s).width)
      .slice(0, 3)
      .forEach((line, i) => ctx.fillText(line, mid, boxY + 92 + i * 36))
  })

  ctx.font = body(24)
  ctx.fillStyle = INK_FAINT
  ctx.textAlign = 'center'
  ctx.fillText(host, W / 2, H - 40)
}

/**
 * 이미지를 만들어 공유하거나 내려받는다.
 * 모바일은 공유 시트(파일 첨부)가 자연스럽고, 없으면 그냥 다운로드로 떨어진다.
 */
export async function saveCardImage(art: CardArt, filename: string) {
  // 웹폰트가 아직 안 왔으면 캔버스는 조용히 기본 폰트로 그린다. 먼저 기다린다.
  try {
    await document.fonts.load(display(54))
    await document.fonts.load(body(30))
  } catch {
    // 폰트를 못 불러도 그림은 나와야 한다
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  drawCard(ctx, art, location.host)

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.92))
  if (!blob) return

  const file = new File([blob], filename, { type: 'image/jpeg' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch {
      // 공유 시트를 닫았을 뿐이다. 다운로드로 흘리지 않는다.
      return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
