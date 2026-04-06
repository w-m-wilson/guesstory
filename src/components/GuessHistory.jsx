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

export default function GuessHistory({ rankHistory, rankSlots, onPickHistoryRow }) {
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
      if (probe && probe.scrollWidth > probe.clientWidth) {
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

  // Auto-scroll to bottom when a new attempt is added
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [rankHistory.length])

  if (rankHistory.length === 0 && !hasLiveSlot) return null

  return (
    <div
      ref={containerRef}
      className="px-4 py-2 relative"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 0 }}
    >
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
      {/* Bottom fade — rows dissolve as they approach the rank board */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: '2.5rem',
          background: 'linear-gradient(to top, var(--color-bg), transparent)',
        }}
      />
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: '9rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex flex-col gap-1">
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
          {hasLiveSlot && (
            <LiveRow slots={rankSlots} compact={compact} />
          )}
        </div>
      </div>
    </div>
  )
}

function NameCell({ item, compact, faint }) {
  const name = item?.name ?? '—'
  const baseStyle = {
    color: item
      ? (faint ? 'var(--color-text-faint)' : 'var(--color-text)')
      : 'var(--color-text-faint)',
  }

  if (compact) {
    return (
      <span
        className="text-[11px] font-semibold"
        style={{
          ...baseStyle,
          flex: '1 1 0',
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          WebkitMaskImage: 'linear-gradient(to right, black 55%, transparent 95%)',
          maskImage: 'linear-gradient(to right, black 55%, transparent 95%)',
        }}
      >
        {name}
      </span>
    )
  }

  return (
    <span
      className="text-[11px] font-semibold whitespace-nowrap shrink-0"
      style={baseStyle}
    >
      {name}
    </span>
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
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden" data-names-row>
        {slots.map((item, i) => (
          <NameCell key={i} item={item} compact={compact} />
        ))}
      </div>
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
      className="flex items-center gap-2 fade-in w-full text-left cursor-pointer rounded-md"
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
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden" data-names-row>
        {slots.map((item, i) => (
          <NameCell key={i} item={item} compact={compact} />
        ))}
      </div>

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
