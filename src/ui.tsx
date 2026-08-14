import type { ReactNode } from 'react'
import { HOUR_UNKNOWN, type Birth, type Element } from './saju'
import { ELEMENT_META } from './data'

/** 회갈색 램킨. 이 앱의 심볼이자 기본 모습이다. */
export const MASCOT_COLOR = '#A2948B'

/**
 * 23x18 도트 스프라이트. c만 오행 색으로 갈아끼우고 나머지는 고정이다.
 * o=외곽 c=몸털 w=흰털 p=귀분홍 e=눈 y=홍채 h=하이라이트 n=코
 */
const SPRITE = [
  '...o....o..............',
  '..oco..oco.............',
  '..ocpoopcoo............',
  '.occccccccco.......oo..',
  '.occccccccco......occo.',
  '.occccccccco......occo.',
  '.owwwheccccoooooo.occo.',
  '.owwweyccccccccccoocco.',
  'onwwwwcccccccccccoocco.',
  '.owwwwwccccccccccoocco.',
  '.owwwwwwwccccccccoocco.',
  '.owwwwwwwwwccccccoocco.',
  '.owwwwwwwwwwwwccccccco.',
  '.owwwwwwwwwwwwwwwccoo..',
  '.owwwwwwwwwwwwwwwwwo...',
  '.owwwowwwooowwwowwwo...',
  '.owwwowwwo.owwwowwwo...',
  '..ooo.ooo...ooo.ooo....',
]

const PIXEL: Record<string, string> = {
  o: '#3E362F', w: '#FDFBF9', p: '#E8B4AE', e: '#3E362F',
  y: '#C5BE55', h: '#FFFFFF', n: '#E8918C',
}

/** 오행 표식 3x3. 등 위에 떠 있다. */
const TOPPER: Record<Element, { rows: string[]; color: string; alt?: string }> = {
  木: { rows: ['.gg', 'gga', '.a.'], color: '#4FB58B', alt: '#2E8563' },
  火: { rows: ['.g.', 'ggg', '.g.'], color: '#D4483A' },
  土: { rows: ['...', '.gg', 'gggg'], color: '#C98A1E' },
  金: { rows: ['.g.', 'ggg', '.g.'], color: '#8A8377' },
  水: { rows: ['.g.', 'ggg', 'gg.'], color: '#3F66AC' },
}

function Px({ rows, at, color }: { rows: string[]; at: [number, number]; color: (ch: string) => string }) {
  return (
    <>
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === '.' ? null : (
            <rect key={`${x},${y}`} x={x + at[0]} y={y + at[1]} width="1" height="1" fill={color(ch)} />
          ),
        ),
      )}
    </>
  )
}

/** el을 주면 그 오행 고양이, 안 주면 우리집 고양이(앱 심볼). */
export function Cat({
  el,
  size = 96,
  className = '',
}: {
  el?: Element
  size?: number
  className?: string
}) {
  const body = el ? ELEMENT_META[el].color : MASCOT_COLOR
  const top = el ? TOPPER[el] : null

  return (
    <svg
      viewBox="0 0 23 18"
      width={size}
      height={(size * 18) / 23}
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
    >
      <Px rows={SPRITE} at={[0, 0]} color={(ch) => (ch === 'c' ? body : PIXEL[ch])} />
      {top && (
        <Px
          rows={top.rows}
          at={[12, 0]}
          color={(ch) => (ch === 'a' ? (top.alt ?? top.color) : top.color)}
        />
      )}
    </svg>
  )
}

/** 일간 한자를 담는 도트 타일. */
export function Seal({ char, className = '' }: { char: string; className?: string }) {
  return (
    <span
      className={`inline-grid size-10 shrink-0 place-items-center border-[3px] border-ink bg-seal text-[15px] leading-none text-white shadow-[3px_3px_0_var(--color-ink)] ${className}`}
    >
      {char}
    </span>
  )
}

export function Panel({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-rise border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_var(--color-ink)] ${className}`}
    >
      {children}
    </section>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 font-display text-[14px] text-ink-faint">{children}</h3>
  )
}

const ZHI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
const zhiOf = (h: number) => ZHI[Math.floor(((h + 1) % 24) / 2)]

const pad = (n: number) => String(n).padStart(2, '0')

export function BirthField({
  value,
  onChange,
  autoFocus,
}: {
  value: Birth | null
  onChange: (b: Birth) => void
  autoFocus?: boolean
}) {
  const dateValue = value ? `${value.y}-${pad(value.m)}-${pad(value.d)}` : ''

  return (
    <div className="flex gap-2">
      <input
        type="date"
        autoFocus={autoFocus}
        value={dateValue}
        max="2100-12-31"
        min="1900-01-01"
        onChange={(e) => {
          const [y, m, d] = e.target.value.split('-').map(Number)
          if (!y || !m || !d) return
          onChange({ y, m, d, h: value?.h ?? HOUR_UNKNOWN })
        }}
        className="min-w-0 flex-1 border-[3px] border-ink bg-hanji px-3 py-3 outline-none focus:border-seal"
      />
      <select
        value={value?.h ?? HOUR_UNKNOWN}
        onChange={(e) =>
          onChange({
            y: value?.y ?? 2000,
            m: value?.m ?? 1,
            d: value?.d ?? 1,
            h: Number(e.target.value),
          })
        }
        className="shrink-0 border-[3px] border-ink bg-hanji px-2 py-3 outline-none focus:border-seal"
      >
        <option value={HOUR_UNKNOWN}>시 모름</option>
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h}>
            {pad(h)}시 · {zhiOf(h)}시
          </option>
        ))}
      </select>
    </div>
  )
}

/** 링크 복사 버튼. Web Share가 있으면 공유 시트를 띄운다. */
export function ShareButton({
  url,
  text,
  label = '친구한테 보내기',
}: {
  url: string
  text: string
  label?: string
}) {
  return (
    <button
      onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ text, url })
          else {
            await navigator.clipboard.writeText(url)
            alert('링크를 복사했어요. 단톡방에 붙여넣으세요.')
          }
        } catch {
          // 사용자가 공유 시트를 닫은 경우 — 알릴 것 없음
        }
      }}
      className="w-full border-[3px] border-ink bg-hanji-deep py-3.5 font-display text-[15px] text-ink shadow-[4px_4px_0_var(--color-ink)] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
    >
      {label}
    </button>
  )
}
