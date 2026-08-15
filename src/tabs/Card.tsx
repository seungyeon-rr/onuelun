import {
  calcSaju, encodeBirth, elementOfGan, ganOfShiShen,
  ELEMENTS, ELEMENT_KO, GAN_KO, josa, type Birth, type Gan,
} from '../saju'
import { AXES, GAN_META, ELEMENT_META, RARITY, rarityRank } from '../data'
import { Panel, Label, ShareButton, Capture, Cat, PRESS } from '../ui'
import { saveCardImage } from '../cardImage'
import { mbtiOdds, mbtiSides } from '../mbti'

/** 이 차이보다 벌어져야 축이 한쪽으로 정해진 걸로 본다 (60% 대 40%) */
const CLEAR = 0.2

const ganName = (g: Gan) => `${GAN_KO[g]}${ELEMENT_KO[elementOfGan(g)]}(${g})`

export default function Card({ birth, myName }: { birth: Birth; myName: string }) {
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
  const odds = mbtiOdds(saju).slice(0, 3)
  const sides = mbtiSides(saju)
  const totalElements = Object.values(saju.elements).reduce((a, b) => a + b, 0)
  // 가장 많은 오행 하나와 아예 없는 오행들만 짚어준다. 다섯 개 다 설명하면 아무도 안 읽는다.
  const mostEl = ELEMENTS.reduce((a, b) => (saju.elements[b] > saju.elements[a] ? b : a))
  const noneEls = ELEMENTS.filter((e) => saju.elements[e] === 0)

  // 20종이 3.8~6.2%로 촘촘해서 퍼센트만으론 감이 안 온다. 사람 수로 바꿔 말한다.
  const pct = RARITY[saju.dayGan][saju.strong ? 'strong' : 'weak']
  const rank = rarityRank(pct)
  const rarityLine = `100명 중 ${Math.round(pct)}명꼴`

  // /share를 거치는 건 미리보기 때문이다. 크롤러가 여기서 og 태그를 읽고,
  // 사람은 그 페이지에서 곧바로 카드로 넘어간다.
  // 문구는 여기서 만들어 넘긴다. 서버가 사주를 다시 풀 이유가 없다.
  const headline =
    (myName.trim() ? `${josa(myName.trim(), '은는')} ` : '') +
    `${grade} ${ganName(saju.dayGan)} '${me.character}'`
  const shareUrl =
    `${location.origin}/share?b=${encodeBirth(birth)}&h=${encodeURIComponent(headline)}`

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
      {/*
        시주가 없으면 여덟 글자 중 여섯 글자로 낸 결과다. 오행 분포뿐 아니라 유형까지 흔들려서
        카드 맨 위에 한 번 밝힌다. 오늘 운세는 일간만 쓰니 여기에만 붙인다.
      */}
      {!saju.hasTime && (
        <p className="border-[3px] border-ink bg-hanji-deep px-3.5 py-2.5 text-[12px] leading-relaxed">
          태어난 시간을 안 넣어서 <b className="font-display">여덟 글자 중 여섯 글자</b>로 낸
          결과예요. 유형(신강/신약)·능력치·MBTI·오행이 다 달라질 수 있어요. 시간을 알면 위 '생일
          변경'에서 넣어보세요.
        </p>
      )}

      <Capture>
        <Panel className="text-center">
          <p className="text-[12px] font-semibold text-ink-faint">
            내 유형 · {rarityLine} · 20종 중 {rank}번째로 드묾
          </p>
          <p className="mt-2 font-display text-[20px] tracking-tight">
            <span className="text-[16px] text-ink-faint">{grade}</span> {ganName(saju.dayGan)}
          </p>
          <Cat el={saju.dayElement} size={112} className="animate-float mx-auto mt-2" />
          <h2 className="mt-1 font-display text-[17px] leading-snug text-seal">{me.character}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{me.traits}</p>
          <p className="mt-3 border-t border-ink/[0.08] pt-3 text-[12px] leading-relaxed text-ink-soft">
            {saju.strong ? me.strong : me.weak}
          </p>
        </Panel>
      </Capture>

      <Panel delay={60}>
        <Label>이런 사람입니다</Label>
        <dl className="flex flex-col gap-3.5">
          {[
            ['잘 될 때', me.strength, 'text-ink'],
            ['과하면', me.weakness, 'text-seal'],
            ['취급 설명서', me.manual, 'text-ink'],
          ].map(([k, v, tone]) => (
            <div key={k}>
              <dt className={`font-display text-[13px] ${tone}`}>{k}</dt>
              <dd className="mt-1 text-[12px] leading-relaxed text-ink-soft">{v}</dd>
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
              <p className="mt-1 font-display text-[12px] leading-snug">{GAN_META[g].character}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel delay={80}>
        <Label>능력치</Label>
        <div className="mt-3 flex flex-col gap-2.5">
          {scores.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2.5">
              <span className="w-9 shrink-0 font-display text-[13px]">{s.key}</span>
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
              <span className="w-7 shrink-0 text-right font-display text-[13px] text-ink-faint">
                {s.score}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-ink/[0.08] pt-3.5 text-[12px] leading-relaxed text-ink-soft">
          <b className="font-display text-seal">{top.key}</b>이 제일 높고{' '}
          <b className="font-display">{bottom.key}</b>이 제일 낮아요. {bottom.low}
        </p>
      </Panel>

      <Panel delay={110}>
        <Label>MBTI 추측 TOP 3</Label>
        <ul className="mt-1 flex flex-col gap-2.5">
          {odds.map((o, i) => (
            <li key={o.type} className="flex items-center gap-2.5">
              <span className="w-14 shrink-0 font-display text-[15px] tracking-tight">{o.type}</span>
              <div className="h-3.5 flex-1 overflow-hidden border-[3px] border-ink bg-hanji">
                <div
                  className="h-full"
                  style={{
                    width: `${(o.p / odds[0].p) * 100}%`,
                    animationDelay: `${170 + i * 70}ms`,
                    background: i === 0 ? 'var(--color-seal)' : 'var(--color-ink)',
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-display text-[13px] text-ink-faint">
                {Math.round(o.p * 100)}%
              </span>
            </li>
          ))}
        </ul>
        {/* TOP 3는 확신이 센 축의 글자가 세 줄 다 같다. 어디가 애매한지는 축을 봐야 안다. */}
        <div className="mt-4 flex justify-between gap-2 border-t border-ink/[0.08] pt-3.5">
          {sides.map((two) => {
            const win = two[0].p >= two[1].p ? two[0] : two[1]
            const sure = Math.abs(two[0].p - two[1].p) > CLEAR
            return (
              <div key={win.letter} className="flex-1 text-center">
                <p className={`font-display text-[16px] ${sure ? 'text-ink' : 'text-ink-faint'}`}>
                  {win.letter}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-faint">{Math.round(win.p * 100)}%</p>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
          60%에 못 미치는 축은 흐리게 뒀어요. 그 축은 사주만으론 어느 쪽인지 못 가립니다.
          <br />
          검사 결과랑 다르면 검사 쪽이 맞습니다.
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
                <span className="font-display text-[13px]" style={{ color: ELEMENT_META[el].color }}>
                  {ELEMENT_KO[el]}
                </span>
                <span className="text-[13px] text-ink-faint">
                  {n}/{totalElements}
                </span>
              </div>
            )
          })}
        </div>
        <ul className="mt-4 flex flex-col gap-2.5 border-t border-ink/[0.08] pt-3.5">
          {mostEl && (
            <li className="text-[12px] leading-relaxed text-ink-soft">
              <b className="font-display" style={{ color: ELEMENT_META[mostEl].color }}>
                {ELEMENT_KO[mostEl]}({mostEl}) 많음
              </b>
              <br />
              {ELEMENT_META[mostEl].mine}
            </li>
          )}
          {noneEls.map((el) => (
            <li key={el} className="text-[12px] leading-relaxed text-ink-soft">
              <b className="font-display" style={{ color: ELEMENT_META[el].color }}>
                {ELEMENT_KO[el]}({el}) 없음
              </b>
              <br />
              {ELEMENT_META[el].lack}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => saveCardImage(art, '오늘운-내카드.jpg')}
          className={`w-full border-[3px] border-ink bg-card py-3.5 font-display text-[14px] text-ink shadow-[4px_4px_0_var(--color-ink)] ${PRESS}`}
        >
          이미지로 저장하기
        </button>
        <ShareButton url={shareUrl} label="링크 복사하기" />
      </div>
    </div>
  )
}
