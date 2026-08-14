import {
  calcSaju, encodeBirth, elementOfGan, ganOfShiShen,
  ELEMENTS, ELEMENT_KO, GAN_KO, type Birth, type Gan,
} from '../saju'
import { AXES, GAN_META, ELEMENT_META, RARITY, rarityRank } from '../data'
import { Panel, Label, ShareButton, Cat, PRESS } from '../ui'
import { saveCardImage } from '../cardImage'

const ganName = (g: Gan) => `${GAN_KO[g]}${ELEMENT_KO[elementOfGan(g)]}(${g})`

export default function Card({ birth }: { birth: Birth }) {
  const saju = calcSaju(birth)
  const me = GAN_META[saju.dayGan]
  const grade = saju.strong ? '신강' : '신약'
  // 신약은 채워주는 쪽(정인)이 찰떡이고 누르는 쪽(편관)이 상극이다.
  // 신강은 반대로, 넘치는 힘을 잡아주는 정관이 찰떡이고 같이 세서 부딪히는 겁재가 상극.
  const best = ganOfShiShen(saju.dayGan, saju.strong ? '正官' : '正印')
  const worst = ganOfShiShen(saju.dayGan, saju.strong ? '劫財' : '偏官')

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

  // 20종이 3.8~6.2%로 촘촘해서 퍼센트만으론 감이 안 온다. 사람 수로 바꿔 말한다.
  const pct = RARITY[saju.dayGan][saju.strong ? 'strong' : 'weak']
  const rank = rarityRank(pct)
  const rarityLine = `100명 중 ${Math.round(pct)}명꼴`

  const shareUrl = `${location.origin}${location.pathname}?t=card&b=${encodeBirth(birth)}`

  const art = {
    el: saju.dayElement,
    rarity: rarityLine,
    rarityNote: `20종 중 ${rank}번째로 드문 유형`,
    character: me.character,
    traits: me.traits,
    best: { label: ganName(best), character: GAN_META[best].character },
    worst: { label: ganName(worst), character: GAN_META[worst].character },
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Panel className="text-center">
        <p className="text-[12px] font-semibold text-ink-faint">
          내 유형 · {rarityLine} · 20종 중 {rank}번째로 드묾
        </p>
        <p className="mt-2 font-display text-[22px] tracking-tight">
          <span className="text-[17px] text-ink-faint">{grade}</span> {ganName(saju.dayGan)}
        </p>
        <Cat el={saju.dayElement} size={112} className="animate-float mx-auto mt-2" />
        <h2 className="mt-1 font-display text-[19px] leading-snug text-seal">{me.character}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{me.traits}</p>
        <p className="mt-3 border-t border-ink/[0.08] pt-3 text-[13px] leading-relaxed text-ink-soft">
          {saju.strong ? me.strong : me.weak}
        </p>
      </Panel>

      <Panel delay={60}>
        <Label>이런 사람입니다</Label>
        <dl className="flex flex-col gap-3.5">
          {[
            ['잘 될 때', me.strength, 'text-ink'],
            ['과하면', me.weakness, 'text-seal'],
            ['취급 설명서', me.manual, 'text-ink'],
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
              ['찰떡', best],
              ['상극', worst],
            ] satisfies [string, Gan][]
          ).map(([tag, g]) => (
            <div key={tag} className="flex-1 border-[3px] border-ink bg-hanji p-2.5">
              <p className="text-[12px] text-ink-faint">
                {tag} · {ganName(g)}
              </p>
              <p className="mt-1 font-display text-[13px] leading-snug">{GAN_META[g].character}</p>
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

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => saveCardImage(art, '오늘운-내카드.jpg')}
          className={`w-full border-[3px] border-ink bg-card py-3.5 font-display text-[15px] text-ink shadow-[4px_4px_0_var(--color-ink)] ${PRESS}`}
        >
          이미지로 저장하기
        </button>
        <ShareButton
          url={shareUrl}
          text={`내 운세 유형은 ${grade} ${ganName(saju.dayGan)} "${me.character}"래`}
          label="링크로 보내기"
        />
      </div>
    </div>
  )
}
