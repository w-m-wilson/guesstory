/**
 * GuessHistory — vertical list of past ranking submissions.
 *
 * Two-column layout per row:
 *   Left:  item names in submission order (full if they fit, truncated+faded if not)
 *   Right: Mastermind feedback dots
 *            ● = in top 5, correct position  ('correct')
 *            ○ = in top 5, wrong position    ('present')
 *            nothing = not in top 5          ('absent' / 'empty')
 *            — = shown when ALL slots give nothing
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export default function GuessHistory({ rankHistory, rankSlots, onPickHistoryRow, topInset = 0 }) {
  const hasLiveSlot = rankSlots?.some(Boolean)
  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const [compact, setCompact] = useState(false)
  const compactRef = useRef(false)
  const [scrolledPast, setScrolledPast] = useState(false)

  // After every render, check if the names in the first visible row overflow
  // their container. If so, switch all rows to compact (truncated+faded) mode.
  // One-way latch: once compact is needed, don't flip back — probing a compact
  // row always shows it fitting, which would otherwise cause oscillation.
  useLayoutEffect(() => {
    if (compactRef.current) return

    const el = containerRef.current
    if (!el) return

    const check = () => {
      const probe = el.querySelector('[data-names-row]')
      if (!probe) return
      const children = [...probe.children]
      if (children.length === 0) return
      // Each cell is a grid column (1fr). If any cell's text overflows its column,
      // scrollWidth will exceed clientWidth.
      const anyOverflow = children.some(c => c.scrollWidth > c.clientWidth + 1)
      if (anyOverflow) {
        compactRef.current = true
        setCompact(true)
      }
    }

    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [rankHistory, rankSlots])

  // Track scroll position to drive the top fade
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrolledPast(el.scrollTop > 4)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-scroll to bottom when a new attempt is added (newest row is just above live row)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [rankHistory.length])

  if (rankHistory.length === 0 && !hasLiveSlot) return null

  return (
    <div
      ref={containerRef}
      className="px-4 pt-1 pb-0 flex flex-col min-h-0"
      style={{ position: 'absolute', top: topInset, bottom: 0, left: 0, right: 0, zIndex: 0 }}
    >
      {/* History list — flex-1 so it uses all space above the pinned live row */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        {/* Top fade — appears when content has scrolled past the top edge */}
        {scrolledPast && (
          <div
            className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
            style={{
              height: '2rem',
              background: 'linear-gradient(to bottom, var(--color-bg), transparent)',
            }}
          />
        )}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex flex-col gap-1 justify-end min-h-full">
            <div className="h-1 shrink-0" aria-hidden="true" />
            {rankHistory.map(({ slots, feedback }, attemptIndex) => (
              <AttemptRow
                key={attemptIndex}
                slots={slots}
                feedback={feedback}
                compact={compact}
                attemptNumber={attemptIndex + 1}
                onPick={() => onPickHistoryRow?.(slots)}
              />
            ))}
            <div className="h-2 shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>
      {hasLiveSlot && (
        <div
          className="shrink-0 z-20 border-t"
          style={{
            background: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <LiveRow slots={rankSlots} compact={compact} />
        </div>
      )}
    </div>
  )
}

function NameCell({ item, compact, faint }) {
  const name = item?.name ?? '—'
  const baseStyle = {
    color: item
      ? (faint ? 'var(--color-text-faint)' : 'var(--color-text)')
      : 'var(--color-text-faint)',
    minWidth: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    ...(compact && {
      WebkitMaskImage: 'linear-gradient(to right, black 55%, transparent 95%)',
      maskImage: 'linear-gradient(to right, black 55%, transparent 95%)',
    }),
  }

  return (
    <span className="text-[11px] font-semibold" style={baseStyle}>
      {name}
    </span>
  )
}

function NamesGrid({ slots, compact }) {
  return (
    <div
      className="flex-1 min-w-0 overflow-hidden"
      data-names-row
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${slots.length}, 1fr)`,
        gap: '0 0.375rem',
        alignItems: 'center',
      }}
    >
      {slots.map((item, i) => (
        <NameCell key={i} item={item} compact={compact} />
      ))}
    </div>
  )
}

function LiveRow({ slots, compact }) {
  return (
    <div className="flex items-center gap-2" style={{ opacity: 0.4 }}>
      <span
        className="text-[10px] font-medium w-5 shrink-0"
        style={{ color: 'var(--color-text-faint)' }}
      >
        →
      </span>
      <NamesGrid slots={slots} compact={compact} />
      {/* Keep live-row width aligned with historical rows' feedback column */}
      <div className="shrink-0" style={{ minWidth: '3.5rem' }} aria-hidden="true" />
    </div>
  )
}

function AttemptRow({ slots, feedback, compact, attemptNumber, onPick }) {
  const hasAnyHit = feedback.some(f => f === 'correct' || f === 'present')

  return (
    <button
      type="button"
      className="flex items-center gap-2 fade-in w-full text-left cursor-pointer rounded-md appearance-none p-0 border-0 bg-transparent"
      onClick={onPick}
    >
      {/* Attempt number */}
      <span
        className="text-[10px] font-medium w-5 shrink-0 tabular-nums"
        style={{ color: 'var(--color-text-faint)' }}
      >
        #{attemptNumber}
      </span>

      {/* Left column: submitted names in order */}
      <NamesGrid slots={slots} compact={compact} />

      {/* Right column: Mastermind feedback — ● always before ○, nothing for absent */}
      <div className="flex items-center gap-0.5 shrink-0 justify-end" style={{ minWidth: '3.5rem' }}>
        {!hasAnyHit ? (
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>—</span>
        ) : (
          [...feedback]
            .sort((a, b) => {
              const order = { correct: 0, present: 1 }
              return (order[a] ?? 2) - (order[b] ?? 2)
            })
            .map((f, i) => {
              if (f === 'correct') {
                return (
                  <span key={i} className="text-xs leading-none" style={{ color: 'var(--color-dot-correct)' }}>
                    ●
                  </span>
                )
              }
              if (f === 'present') {
                return (
                  <span key={i} className="text-xs leading-none" style={{ color: 'var(--color-dot-present)' }}>
                    ○
                  </span>
                )
              }
              return null
            })
        )}
      </div>
    </button>
  )
}
