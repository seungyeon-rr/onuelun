import { calcSaju, dateKey, ganOfDay, seededPick, todayShiShen, SHISHEN_KO, type Birth } from '../saju'
import { DAILY, PAIR_CHEMI, type Tip } from '../data'
import { Panel, Label, Seal, Cat } from '../ui'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

export default function Daily({ birth }: { birth: Birth }) {
  const today = new Date()
  const saju = calcSaju(birth)
  const shishen = todayShiShen(saju.dayGan, today)
  const f = DAILY[shishen]

  // 날짜와 일간이 같으면 언제 열어도 같은 결과가 나와야 한다. 새로고침으로 다시 뽑히면 재미가 없다.
  const seed = `${dateKey(today)}|${saju.dayGan}|${shishen}`
  const menu = seededPick(f.menu, seed + 'menu')
  const drink = seededPick(f.drink, seed + 'drink')
  const avoid = seededPick(f.avoid, seed + 'avoid')

  // 오늘부터 7일. 일간이 매일 바뀌니 십신 7개도 서로 다르고, 최고날과 최악날이 겹치지 않는다.
  // ponytail: 날의 점수는 사람 궁합 점수를 그대로 쓴다. 같은 십신 성격을 재는 거라 방향이 안 어긋난다.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const s = todayShiShen(saju.dayGan, d)
    return { d, s, score: PAIR_CHEMI[s].score, today: i === 0 }
  })
  const best = week.reduce((a, b) => (b.score > a.score ? b : a))
  const worst = week.reduce((a, b) => (b.score < a.score ? b : a))
  const dayName = (w: (typeof week)[number]) =>
    w.today ? '오늘' : `${WEEKDAY[w.d.getDay()]}요일`

  return (
    <div className="flex flex-col gap-2.5">
      <Panel className="relative overflow-hidden">
        <div className="animate-stamp absolute right-5 top-5" style={{ animationDelay: '250ms' }}>
          <Seal char={ganOfDay(today)} className="size-11 text-[28px]" />
        </div>

        <p className="text-[12px] font-semibold text-ink-faint">
          {today.getMonth() + 1}월 {today.getDate()}일 {WEEKDAY[today.getDay()]}요일
        </p>
        <p className="mt-5 text-[14px] text-ink-soft">오늘 나에게 들어온 기운</p>
        <h2 className="mt-2 font-display text-[32px] leading-none tracking-tight">
          {SHISHEN_KO[shishen]}
          <span className="ml-2 text-[15px] text-ink-faint">
            {shishen}({f.key})
          </span>
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <Cat el={saju.dayElement} size={40} className="animate-float shrink-0" />
          <p className="font-display text-[14px] text-seal">{f.mood}</p>
        </div>
        <p className="mt-5 border-t border-ink/[0.08] pt-5 text-[14px] leading-relaxed text-ink-soft">
          {f.line}
        </p>
      </Panel>

      <Panel delay={80} className="divide-y divide-ink/[0.06]">
        {(
          [
            ['오늘 점심', menu],
            ['오늘 마실 것', drink],
          ] satisfies [string, Tip][]
        ).map(([label, tip]) => (
          <div key={label} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="shrink-0 font-display text-[13px] text-ink-faint">{label}</span>
              <span className="text-right font-display text-[19px] leading-tight">{tip.what}</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{tip.why}</p>
          </div>
        ))}
      </Panel>

      <Panel delay={140} className="bg-seal/[0.07]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="shrink-0 font-display text-[13px] text-seal/70">오늘 하지 말 것</span>
          <span className="text-right font-display text-[19px] leading-tight text-seal">
            {avoid.what}
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{avoid.why}</p>
      </Panel>

      <Panel delay={200}>
        <Label>앞으로 7일</Label>
        <div className="flex items-end gap-1.5" aria-hidden>
          {week.map((w) => (
            <div key={+w.d} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-12 w-full items-end">
                <div
                  className={`w-full border-[2px] border-ink ${
                    w === best ? 'bg-seal' : w === worst ? 'bg-hanji-deep' : 'bg-ink-faint'
                  }`}
                  style={{ height: `${20 + w.score * 8}%` }}
                />
              </div>
              <span
                className={`font-display text-[12px] ${w.today ? 'text-ink' : 'text-ink-faint'}`}
              >
                {WEEKDAY[w.d.getDay()]}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3.5 divide-y divide-ink/[0.06] border-t border-ink/[0.08] pt-1">
          {(
            [
              [`${dayName(best)}엔 이걸`, best, 'text-ink'],
              [`${dayName(worst)}엔 이것만`, worst, 'text-seal'],
            ] as const
          ).map(([label, w, tone]) => (
            <div key={label} className="py-3.5 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="shrink-0 font-display text-[13px] text-ink-faint">{label}</span>
                <span className={`text-right font-display text-[17px] leading-tight ${tone}`}>
                  {DAILY[w.s].week.what}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                <span className="text-ink-faint">{SHISHEN_KO[w.s]} 운. </span>
                {DAILY[w.s].week.why}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <p className="px-2 pb-2 text-center text-[14px] leading-relaxed text-ink-faint">
        자정에 딱 한 번 바뀌어요. 새로고침해도 그대로!
      </p>
    </div>
  )
}
