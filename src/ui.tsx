import type { ReactNode } from 'react'
import { HOUR_UNKNOWN, ZHI, hourOfZhi, zhiIndexOf, zhiRange, type Birth, type Element } from './saju'
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

/** 도트 UI의 눌림. 그림자만큼 밀어 넣어야 실제로 내려앉은 것처럼 보인다. */
export const PRESS =
  'transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'

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

  const now = new Date()
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  const field =
    'w-full border-[3px] border-ink bg-hanji px-3 py-3.5 outline-none focus:border-seal'

  return (
    <div className="flex flex-col gap-2 text-left">
      <label className="flex flex-col gap-1">
        <span className="font-display text-[13px] text-ink-faint">생년월일</span>
        <input
          type="date"
          autoFocus={autoFocus}
          value={dateValue}
          max={today}
          min="1900-01-01"
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-').map(Number)
            if (!y || !m || !d) return
            // max는 달력만 막는다. 키보드로 직접 친 날짜는 그대로 들어오므로 여기서 한 번 더 본다.
            if (e.target.value > today) return
            onChange({ y, m, d, h: value?.h ?? HOUR_UNKNOWN })
          }}
          className={field}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-display text-[13px] text-ink-faint">태어난 시각</span>
        <select
          value={value && value.h !== HOUR_UNKNOWN ? zhiIndexOf(value.h) : HOUR_UNKNOWN}
          onChange={(e) => {
            const i = Number(e.target.value)
            onChange({
              y: value?.y ?? 2000,
              m: value?.m ?? 1,
              d: value?.d ?? 1,
              h: i === HOUR_UNKNOWN ? HOUR_UNKNOWN : hourOfZhi(i),
            })
          }}
          className={field}
        >
          <option value={HOUR_UNKNOWN}>시 모름 (몰라도 봐드려요)</option>
          {ZHI.map((z, i) => (
            <option key={z} value={i}>
              {z}시 · {zhiRange(i)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

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
          // text가 아니라 title로 넘긴다. text는 공유 시트가 url 뒤에 그대로 이어붙여서
          // "...party=abc 우리 모임 기운..." 한 덩어리가 되고, 링크의 마지막 값이 오염된다.
          if (navigator.share) await navigator.share({ title: text, url })
          else {
            await navigator.clipboard.writeText(url)
            alert('링크를 복사했어요. 단톡방에 붙여넣으세요.')
          }
        } catch {
          // 사용자가 공유 시트를 닫은 경우 — 알릴 것 없다
        }
      }}
      className={`w-full border-[3px] border-ink bg-hanji-deep py-3.5 font-display text-[15px] text-ink shadow-[4px_4px_0_var(--color-ink)] ${PRESS}`}
    >
      {label}
    </button>
  )
}
