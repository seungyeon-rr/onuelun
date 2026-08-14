import type { ReactNode } from 'react'
import { HOUR_UNKNOWN, type Birth, type Element } from './saju'
import { COATS, MARK, MARK_COLOR, MASCOT, PIXEL, SPRITES } from './cat'


function Px({ rows, at = [0, 0], color }: { rows: string[]; at?: [number, number]; color: (ch: string) => string }) {
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
  const cat = el ? COATS[el] : MASCOT
  const palette: Record<string, string> = { ...PIXEL, c: cat.c, d: cat.d, y: cat.y, k: cat.k ?? cat.d }
  const mark = el ? MARK_COLOR[el] : null

  return (
    <svg
      viewBox="0 0 26 21"
      width={size}
      height={(size * 21) / 26}
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
    >
      <Px rows={SPRITES[cat.pose]} color={(ch) => palette[ch]} />
      {mark && <Px rows={MARK} at={[22, 0]} color={() => mark} />}
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
