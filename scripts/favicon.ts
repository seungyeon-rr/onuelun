// 심볼 고양이 스프라이트에서 파비콘을 뽑는다. 도트를 고치면 `npm run favicon`을 다시 돌린다.
// 배경 없음 — 브라우저 탭 색을 그대로 비친다.
import { writeFileSync } from 'node:fs'
import { MASCOT, PIXEL, SPRITES } from '../src/cat.ts'

const rows = SPRITES[MASCOT.pose]
const color: Record<string, string> = {
  ...PIXEL,
  c: MASCOT.c,
  d: MASCOT.d,
  y: MASCOT.y,
  k: MASCOT.k ?? MASCOT.d,
}

/** 빈 칸을 걷어낸 실제 그림 범위. 파비콘은 작아서 여백이 아깝다. */
const drawn = rows.flatMap((row, y) =>
  [...row].flatMap((ch, x) => (ch === '.' ? [] : [{ x, y }])),
)
const minX = Math.min(...drawn.map((p) => p.x))
const maxX = Math.max(...drawn.map((p) => p.x))
const minY = Math.min(...drawn.map((p) => p.y))
const maxY = Math.max(...drawn.map((p) => p.y))

// 정사각으로 맞춘다. 남는 쪽은 위아래·좌우로 반씩 나눠 여백을 준다.
const side = Math.max(maxX - minX + 1, maxY - minY + 1)
const x0 = minX - Math.floor((side - (maxX - minX + 1)) / 2)
const y0 = minY - Math.floor((side - (maxY - minY + 1)) / 2)

const rects: string[] = []
rows.forEach((row, y) => {
  let x = 0
  while (x < row.length) {
    const ch = row[x]
    if (ch === '.') {
      x += 1
      continue
    }
    let run = 1
    while (x + run < row.length && row[x + run] === ch) run += 1
    rects.push(`<rect x="${x}" y="${y}" width="${run}" height="1" fill="${color[ch]}"/>`)
    x += run
  }
})

writeFileSync(
  new URL('../public/favicon.svg', import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${side} ${side}" shape-rendering="crispEdges">\n${rects.join('\n')}\n</svg>\n`,
)
console.log(`favicon.svg — ${side}x${side}, ${rects.length} rects`)
