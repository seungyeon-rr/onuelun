// lunar-javascript는 타입 선언을 제공하지 않아 실제로 쓰는 것만 최소로 선언한다.
declare module 'lunar-javascript' {
  export class EightChar {
    getYear(): string
    getMonth(): string
    getDay(): string
    getTime(): string
    getDayGan(): string
    getYearWuXing(): string
    getMonthWuXing(): string
    getDayWuXing(): string
    getTimeWuXing(): string
    getYearShiShenGan(): string
    getMonthShiShenGan(): string
    getTimeShiShenGan(): string
    getYearShiShenZhi(): string[]
    getMonthShiShenZhi(): string[]
    getDayShiShenZhi(): string[]
    getTimeShiShenZhi(): string[]
  }
  export class Lunar {
    getEightChar(): EightChar
    getDayInGanZhi(): string
  }
  export class Solar {
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar
    static fromDate(date: Date): Solar
    getLunar(): Lunar
  }
}
