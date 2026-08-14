import { calcSaju, encodeBirth, ELEMENTS, ELEMENT_KO, GAN_KO, type Birth } from '../saju'
import { AXES, ELEMENT_META, type Axis, type AxisMeta } from '../data'
import { Panel, Label, Seal, ShareButton, Cat } from '../ui'

const byKey = Object.fromEntries(AXES.map((a) => [a.key, a])) as Record<Axis, AxisMeta>

export default function Card({ birth }: { birth: Birth }) {
  const saju = calcSaju(birth)

  const scores = AXES.map((a) => ({
    ...a,
    score: a.members.reduce((sum, m) => sum + saju.shishen[m], 0),
  }))
  const max = Math.max(1, ...scores.map((s) => s.score))
  const top = scores.reduce((a, b) => (b.score > a.score ? b : a))
  const bottom = scores.reduce((a, b) => (b.score < a.score ? b : a))
  const totalElements = Object.values(saju.elements).reduce((a, b) => a + b, 0)
  // 가장 많은 오행 하나와 아예 없는 오행들만 짚어준다. 다섯 개 다 설명하면 아무도 안 읽는다.
  const mostEl = ELEMENTS.reduce((a, b) => (saju.elements[b] > saju.elements[a] ? b : a))
  const noneEls = ELEMENTS.filter((e) => saju.elements[e] === 0)

  const shareUrl = `${location.origin}${location.pathname}?t=card&b=${encodeBirth(birth)}`

  return (
    <div className="flex flex-col gap-2.5">
      <Panel className="relative overflow-hidden text-center">
        <div className="animate-stamp absolute right-5 top-5" style={{ animationDelay: '300ms' }}>
          <Seal char={saju.dayGan} className="size-11 text-[28px]" />
        </div>

        <p className="text-[12px] font-semibold text-ink-faint">사주에서 '나'인 글자</p>
        <p className="mt-3 font-display text-[32px] tracking-tight">
          {GAN_KO[saju.dayGan]}
          <span className="text-[28px] text-ink-faint">({saju.dayGan})</span>
        </p>
        <p className="mt-1 text-[14px] text-ink-soft">
          {ELEMENT_KO[saju.dayElement]}({saju.dayElement}) · {ELEMENT_META[saju.dayElement].label}
        </p>
        {/* 물어보는 사람이 있었다. 기준점이라는 걸 안 알려주면 그냥 한자 하나로 보인다. */}
        <p className="mx-auto mt-3 max-w-[30ch] text-[12px] leading-relaxed text-ink-faint">
          여덟 글자 중 나 자신인 한 글자예요. 오늘 운세도 아래 캐릭터도 전부 이걸 기준으로
          계산돼요.
        </p>

        <div className="mt-6 border-t border-ink/[0.08] pt-5">
          <p className="text-[12px] font-semibold text-ink-faint">내 캐릭터</p>
          <Cat el={saju.dayElement} size={112} className="animate-float mx-auto mt-3" />
          <h2 className="mt-1 font-display text-[22px] leading-snug text-seal">{top.character}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{top.traits}</p>
        </div>
      </Panel>

      {/* 캐릭터 이름만 던지고 끝내면 절반이다. 강점·약점·다루는 법까지 풀어준다. */}
      <Panel delay={60}>
        <Label>이런 사람입니다</Label>
        <dl className="flex flex-col gap-3.5">
          {[
            ['잘 될 때', top.strength, 'text-ink'],
            ['과하면', top.weakness, 'text-seal'],
            ['취급 설명서', top.manual, 'text-ink'],
          ].map(([k, v, tone]) => (
            <div key={k}>
              <dt className={`font-display text-[14px] ${tone}`}>{k}</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-ink-soft">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex gap-2 border-t border-ink/[0.08] pt-4">
          {(
            [
              ['찰떡', top.best],
              ['상극', top.worst],
            ] satisfies [string, Axis][]
          ).map(([tag, axis]) => (
            <div key={tag} className="flex-1 border-[3px] border-ink bg-hanji p-2.5">
              <p className="text-[12px] text-ink-faint">
                {tag} · {axis}
              </p>
              <p className="mt-1 font-display text-[13px] leading-snug">{byKey[axis].character}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel delay={80}>
        <Label>능력치</Label>
        <div className="mt-3 flex flex-col gap-2.5">
          {scores.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2.5">
              <span className="w-9 shrink-0 font-display text-[14px]">{s.key}</span>
              <div className="h-4 flex-1 overflow-hidden border-[3px] border-ink bg-hanji">
                <div
                  className="h-full bg-ink"
                  style={{
                    width: `${(s.score / max) * 100}%`,
                    animationDelay: `${140 + i * 70}ms`,
                    background: s.key === top.key ? 'var(--color-seal)' : undefined,
                  }}
                />
              </div>
              <span className="w-7 shrink-0 text-right font-display text-[14px] text-ink-faint">
                {s.score}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-ink/[0.08] pt-3.5 text-[13px] leading-relaxed text-ink-soft">
          <b className="font-display text-seal">{top.key}</b>이 제일 높고{' '}
          <b className="font-display">{bottom.key}</b>이 제일 낮아요. {bottom.low}
        </p>
      </Panel>

      <Panel delay={140}>
        <Label>오행 분포</Label>
        <div className="mt-3 flex justify-between gap-2">
          {ELEMENTS.map((el) => {
            const n = saju.elements[el]
            return (
              <div key={el} className="flex flex-1 flex-col items-center gap-2">
                <Cat el={el} size={38} className={n === 0 ? 'opacity-25 grayscale' : ''} />
                <div className="flex h-12 flex-col-reverse items-center justify-start gap-1">
                  {Array.from({ length: n }, (_, i) => (
                    <span
                      key={i}
                      className="size-2.5"
                      style={{ background: ELEMENT_META[el].color }}
                    />
                  ))}
                </div>
                <span className="font-display text-[14px]" style={{ color: ELEMENT_META[el].color }}>
                  {ELEMENT_KO[el]}
                </span>
                <span className="text-[14px] text-ink-faint">
                  {n}/{totalElements}
                </span>
              </div>
            )
          })}
        </div>
        <ul className="mt-4 flex flex-col gap-2.5 border-t border-ink/[0.08] pt-3.5">
          {mostEl && (
            <li className="text-[13px] leading-relaxed text-ink-soft">
              <b className="font-display" style={{ color: ELEMENT_META[mostEl].color }}>
                {ELEMENT_KO[mostEl]}({mostEl}) 많음
              </b>
              <br />
              {ELEMENT_META[mostEl].mine}
            </li>
          )}
          {noneEls.map((el) => (
            <li key={el} className="text-[13px] leading-relaxed text-ink-soft">
              <b className="font-display" style={{ color: ELEMENT_META[el].color }}>
                {ELEMENT_KO[el]}({el}) 없음
              </b>
              <br />
              {ELEMENT_META[el].lack}
            </li>
          ))}
        </ul>
        {!saju.hasTime && (
          <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
            태어난 시간을 모르면 합계가 8이 아니라 6이에요. 알고 있으면 더 정확해져요!
          </p>
        )}
      </Panel>

      <ShareButton url={shareUrl} text={`내 운세 캐릭터는 "${top.character}"래`} />
    </div>
  )
}
