import { calcSaju, dateKey, ganOfDay, seededPick, todayShiShen, GAN_KO, SHISHEN_KO, type Birth } from '../saju'
import { DAILY, type Tip } from '../data'
import { Panel, Seal, Cat } from '../ui'

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

  return (
    <div className="flex flex-col gap-2.5">
      <Panel className="relative overflow-hidden">
        <div className="animate-stamp absolute right-5 top-5" style={{ animationDelay: '250ms' }}>
          <Seal char={ganOfDay(today)} className="size-11 text-[28px]" />
        </div>

        <p className="text-[12px] font-semibold text-ink-faint">
          {today.getMonth() + 1}월 {today.getDate()}일 {WEEKDAY[today.getDay()]}요일
        </p>
        <p className="mt-5 text-[14px] text-ink-soft">
          {GAN_KO[saju.dayGan]}({saju.dayGan})의 나에게 오늘 들어온 기운
        </p>
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

      {/* 결과보다 근거가 본체다. what은 크게, why는 바로 아래 한 줄로 붙인다. */}
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

      <p className="px-2 pb-2 text-center text-[14px] leading-relaxed text-ink-faint">
        자정에 딱 한 번 바뀌어요. 새로고침해도 그대로!
      </p>
    </div>
  )
}
