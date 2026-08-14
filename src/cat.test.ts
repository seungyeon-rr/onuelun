import { describe, expect, it } from 'vitest'
import { COATS, PIXEL, SPRITES } from './cat'

// 도트를 손으로 찍으니 한 칸만 밀려도 조용히 깨진다. 격자 크기와 색 정의만 지킨다.
describe('고양이 스프라이트', () => {
  const paletteKeys = new Set([...Object.keys(PIXEL), 'c', 'd', 'y', '.'])

  it('모두 26x21이고 정의된 색만 쓴다', () => {
    for (const [pose, rows] of Object.entries(SPRITES)) {
      expect(rows, pose).toHaveLength(21)
      rows.forEach((row, y) => {
        expect(row.length, `${pose}:${y}`).toBe(26)
        for (const ch of row) expect(paletteKeys.has(ch), `${pose}:${y} '${ch}'`).toBe(true)
      })
    }
  })

  it('오행마다 자세가 겹치지 않는다', () => {
    const poses = Object.values(COATS).map((c) => c.pose)
    expect(new Set(poses).size).toBe(poses.length)
  })
})
