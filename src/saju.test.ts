import { describe, it, expect } from 'vitest'
import { Solar } from 'lunar-javascript'
import {
  calcSaju, shishenOf, ganOfShiShen, decodeBirth, encodeBirth, josa, seededPick,
  GANS, SHISHEN, ELEMENTS, HOUR_UNKNOWN, SHISHEN_KO, todayShiShen, elementOfGan,
  zhiIndexOf, hourOfZhi, zhiRange, isOffDay,
} from './saju'
import { GAN_META, PAIR_CHEMI, DAILY } from './data'

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

  // 예전엔 시각을 그대로 저장했다. 30분 규칙으로 읽으면 13시는 미시가 아니라 오시다.
  it('예전에 저장된 시각도 지지 기준으로 접어 들인다', () => {
    expect(decodeBirth('19930512-13')!.h).toBe(12) // 오시(11:30~13:29)
    expect(decodeBirth('19930512-23')!.h).toBe(22) // 해시(21:30~23:29)
    expect(decodeBirth('19930512-1')!.h).toBe(0) // 자시(23:30~01:29)
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

// 앞으로 7일 미리보기는 "최고날과 최악날이 항상 다른 날"이라는 전제 위에 서 있다.
// 일간이 매일 한 칸씩 도는 한 7일 안에서 십신은 겹치지 않는다.
describe('앞으로 7일', () => {
  it('연속 7일의 십신이 서로 다르다', () => {
    for (const gan of GANS) {
      for (const start of [new Date(2026, 0, 1), new Date(2026, 7, 14), new Date(2027, 11, 25)]) {
        const week = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(start)
          d.setDate(start.getDate() + i)
          return todayShiShen(gan, d)
        })
        expect(new Set(week).size).toBe(7)
      }
    }
  })

  it('7일치 점수를 매길 십신에 빠진 게 없다', () => {
    for (const s of SHISHEN) expect(PAIR_CHEMI[s].score).toBeGreaterThan(0)
  })
})

// 오행 관계도는 ELEMENTS 순서에 기대고 있다. 시계방향 이웃이 상생(내가 생하는 것 = 식상),
// 두 칸 건너가 상극(내가 극하는 것 = 재성)이라는 전제가 깨지면 화살표가 통째로 거짓말이 된다.
describe('오행 관계도', () => {
  it('이웃은 상생, 두 칸 건너는 상극이다', () => {
    for (const me of GANS) {
      const i = ELEMENTS.indexOf(elementOfGan(me))
      const born = ELEMENTS[(i + 1) % 5]
      const killed = ELEMENTS[(i + 2) % 5]
      for (const other of GANS) {
        const s = shishenOf(me, other)
        const el = elementOfGan(other)
        if (el === born) expect(['食神', '傷官']).toContain(s)
        if (el === killed) expect(['偏財', '正財']).toContain(s)
      }
    }
  })
})

describe('십이지시', () => {
  // 자시는 23:00이 아니라 23:30에 시작한다. 23시에 태어난 사람은 해시다.
  it('30분 앞당겨 끊는다', () => {
    expect(zhiRange(0)).toBe('23:30~01:29')
    expect(zhiRange(1)).toBe('01:30~03:29')
    expect(zhiIndexOf(23)).toBe(11) // 해
    expect(zhiIndexOf(0)).toBe(0) // 자
    expect(zhiIndexOf(1)).toBe(0) // 자
    expect(zhiIndexOf(2)).toBe(1) // 축
    expect(zhiIndexOf(14)).toBe(7) // 미
  })

  it('고른 지시가 저장했다 읽어도 그대로다', () => {
    for (let i = 0; i < 12; i++) expect(zhiIndexOf(hourOfZhi(i))).toBe(i)
  })

  // 저장하는 시각이 지지 한가운데여야 lunar-javascript도 같은 시주를 낸다.
  it('저장한 시각이 그 지지의 시주로 계산된다', () => {
    const ZHI_HANJA = '子丑寅卯辰巳午未申酉戌亥'
    for (let i = 0; i < 12; i++) {
      const saju = calcSaju({ y: 1993, m: 5, d: 12, h: hourOfZhi(i) })
      expect(saju.pillars[3][1]).toBe(ZHI_HANJA[i])
    }
  })
})

describe('쉬는 날', () => {
  it('주말과 공휴일을 잡아낸다', () => {
    expect(isOffDay(new Date(2026, 7, 15))).toBe(true) // 광복절 (토)
    expect(isOffDay(new Date(2026, 0, 1))).toBe(true) // 신정 (목)
    expect(isOffDay(new Date(2026, 1, 17))).toBe(true) // 설날, 음력 1/1 (화)
    expect(isOffDay(new Date(2026, 8, 25))).toBe(true) // 추석, 음력 8/15 (금)
    expect(isOffDay(new Date(2026, 4, 24))).toBe(true) // 부처님오신날, 음력 4/8 (일)
    expect(isOffDay(new Date(2026, 7, 16))).toBe(true) // 일요일
    expect(isOffDay(new Date(2026, 7, 19))).toBe(false) // 그냥 수요일
    expect(isOffDay(new Date(2026, 8, 24))).toBe(true) // 추석 연휴 첫날, 음력 8/14 (목)
    expect(isOffDay(new Date(2026, 1, 16))).toBe(false) // 설 전날(섣달그믐)은 안 본다 (월)
  })

  it('회사 추천이 있는 목록은 그걸 빼도 남는 게 있다', () => {
    for (const f of Object.values(DAILY)) {
      for (const list of [f.menu, f.drink, f.avoid]) {
        expect(list.filter((t) => !t.office).length).toBeGreaterThan(0)
      }
    }
  })
})
