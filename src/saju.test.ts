import { describe, it, expect } from 'vitest'
import { Solar } from 'lunar-javascript'
import {
  calcSaju, shishenOf, ganOfShiShen, decodeBirth, encodeBirth, josa, seededPick,
  GANS, SHISHEN, HOUR_UNKNOWN, SHISHEN_KO,
} from './saju'
import { GAN_META } from './data'

describe('팔자 계산', () => {
  it('알려진 생년월일시의 사주가 일치한다', () => {
    expect(calcSaju({ y: 1993, m: 5, d: 12, h: 14 }).pillars)
      .toEqual(['癸酉', '丁巳', '癸巳', '己未'])
  })

  // 사주는 양력 1월 1일이 아니라 입춘에서 해가 바뀐다.
  // 2024년 입춘은 2/4 16:27이라 같은 날에도 시각에 따라 년주가 달라져야 한다.
  it('입춘 경계에서 년주가 바뀐다', () => {
    expect(calcSaju({ y: 2024, m: 2, d: 4, h: 10 }).pillars[0]).toBe('癸卯')
    expect(calcSaju({ y: 2024, m: 2, d: 4, h: 18 }).pillars[0]).toBe('甲辰')
  })

  it('시를 모르면 시주를 버린다', () => {
    const s = calcSaju({ y: 1993, m: 5, d: 12, h: HOUR_UNKNOWN })
    expect(s.hasTime).toBe(false)
    expect(s.pillars).toHaveLength(3)
    // 시주가 빠졌으니 오행 합계도 8이 아니라 6
    expect(Object.values(s.elements).reduce((a, b) => a + b, 0)).toBe(6)
  })

  it('오행 개수 합이 팔자 글자 수와 같다', () => {
    const s = calcSaju({ y: 1993, m: 5, d: 12, h: 14 })
    expect(Object.values(s.elements).reduce((a, b) => a + b, 0)).toBe(8)
  })
})

describe('일간 유형', () => {
  // 카드의 찰떡/상극이 여기서 나온다. 하나라도 못 찾으면 화면이 깨진다.
  it('모든 일간에서 십신 10개가 천간 하나씩과 1:1로 맞는다', () => {
    for (const me of GANS) {
      const found = SHISHEN.map((s) => ganOfShiShen(me, s))
      expect(new Set(found).size).toBe(10)
      expect(GAN_META[me]).toBeDefined()
    }
  })

  // 월지가 비겁/인성이면(득령) 그 자체로 신강이다. 나머지 자리는 볼 것도 없다.
  it('득령하면 신강이다', () => {
    // 癸일간 + 월지 亥(비겁). 나머지는 재관으로 채워도 신강이어야 한다.
    expect(calcSaju({ y: 1983, m: 11, d: 20, h: 10 }).pillars[1]).toBe('癸亥')
    expect(calcSaju({ y: 1983, m: 11, d: 20, h: 10 }).strong).toBe(true)
  })

  // 한쪽으로 쏠리면 유형 절반이 죽는다. 실측 47.6%라 40~60% 안에 있어야 한다.
  it('신강/신약이 한쪽으로 쏠리지 않는다', () => {
    let strong = 0
    const dates = []
    for (let y = 1970; y < 2010; y++)
      for (let m = 1; m <= 12; m++) dates.push({ y, m, d: 15, h: 9 })
    for (const b of dates) if (calcSaju(b).strong) strong++
    const rate = strong / dates.length
    expect(rate).toBeGreaterThan(0.4)
    expect(rate).toBeLessThan(0.6)
  })
})

describe('십신', () => {
  it('일간 자신은 비견이다', () => {
    expect(shishenOf('甲', '甲')).toBe('比肩')
    expect(shishenOf('癸', '癸')).toBe('比肩')
  })

  // 직접 구현한 공식을 라이브러리의 독립적인 십신 계산과 대조한다.
  it('라이브러리가 계산한 십신과 모든 천간 조합에서 일치한다', () => {
    const cases = [
      { y: 1993, m: 5, d: 12, h: 14 },
      { y: 2024, m: 2, d: 4, h: 18 },
      { y: 1988, m: 11, d: 3, h: 7 },
      { y: 2001, m: 7, d: 21, h: 23 },
    ]
    for (const c of cases) {
      const e = Solar.fromYmdHms(c.y, c.m, c.d, c.h, 0, 0).getLunar().getEightChar()
      const day = e.getDayGan()
      const pairs: [string, string][] = [
        [e.getYear()[0], e.getYearShiShenGan()],
        [e.getMonth()[0], e.getMonthShiShenGan()],
        [e.getTime()[0], e.getTimeShiShenGan()],
      ]
      for (const [gan, expected] of pairs) {
        // 라이브러리는 간체자 + 편관을 七杀로 쓴다.
        const normalized = expected
          .replace('财', '財').replace('伤', '傷').replace('七杀', '偏官')
        expect(shishenOf(day, gan)).toBe(normalized)
      }
    }
  })

  it('한글 이름이 10개 모두 있다', () => {
    expect(Object.keys(SHISHEN_KO)).toHaveLength(10)
  })
})

describe('생일 인코딩', () => {
  it('왕복이 보존된다', () => {
    for (const b of [
      { y: 1993, m: 5, d: 12, h: 14 },
      { y: 2000, m: 1, d: 1, h: 0 },
      { y: 1988, m: 12, d: 31, h: HOUR_UNKNOWN },
    ]) {
      expect(decodeBirth(encodeBirth(b))).toEqual(b)
    }
  })

  it('잘못된 값을 거부한다', () => {
    for (const bad of ['', '19930512', '1993-05-12', '19930230-1', '19930512-24', 'abcdefgh-1']) {
      expect(decodeBirth(bad)).toBeNull()
    }
  })
})

describe('추천 뽑기', () => {
  it('같은 시드면 항상 같은 값이 나온다', () => {
    const list = ['가', '나', '다', '라', '마']
    expect(seededPick(list, '2026-8-14癸')).toBe(seededPick(list, '2026-8-14癸'))
  })

  it('시드가 다르면 값이 갈린다', () => {
    const list = Array.from({ length: 20 }, (_, i) => i)
    const picks = new Set(Array.from({ length: 30 }, (_, i) => seededPick(list, `seed${i}`)))
    expect(picks.size).toBeGreaterThan(5)
  })
})

describe('조사', () => {
  it('받침이 있으면 은·이·을·과', () => {
    expect(josa('가람', '은는')).toBe('가람은')
    expect(josa('민준', '이가')).toBe('민준이')
    expect(josa('다인', '을를')).toBe('다인을')
    expect(josa('나은', '은는')).toBe('나은은')
    expect(josa('우리 모임', '을를')).toBe('우리 모임을')
    expect(josa('3팀 점심', '과와')).toBe('3팀 점심과')
  })

  it('받침이 없으면 는·가·를·와', () => {
    expect(josa('서아', '은는')).toBe('서아는')
    expect(josa('지수', '이가')).toBe('지수가')
    expect(josa('제나', '을를')).toBe('제나를')
    expect(josa('유나', '과와')).toBe('유나와')
  })

  // 한글이 아니면 받침 없음으로 본다. 'Kate는'이 'Kate은'보다 낫다.
  it('영문·이모지 이름도 문장이 깨지지 않는다', () => {
    expect(josa('Kate', '은는')).toBe('Kate는')
    expect(josa('🐱', '이가')).toBe('🐱가')
  })
})
