/**
 * GuessHistory — horizontal scroller showing all past ranking submissions.
 *
 * Each card:
 *   Top row: spoiler-free dots (● in-top-5, ○ not-top-5, ✗ empty)
 *   Bottom row: 2-letter item keys aligned under their dot
 *
 * Dots are fact-of only — no positional info is communicated.
 */
export default function GuessHistory({ rankHistory, keyMap }) {
  if (rankHistory.length === 0) return null

  return (
    <div
      className="shrink-0 overflow-x-auto px-4 py-2"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex gap-3 w-max">
        {rankHistory.map(({ slots, feedback }, attemptIndex) => (
          <AttemptCard
            key={attemptIndex}
            slots={slots}
            feedback={feedback}
            keyMap={keyMap}
            attemptNumber={attemptIndex + 1}
          />
        ))}
      </div>
    </div>
  )
}

function AttemptCard({ slots, feedback, keyMap, attemptNumber }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-[10px] font-medium mb-0.5"
        style={{ color: 'var(--color-text-faint)' }}
      >
        #{attemptNumber}
      </span>

      {/* Dots + keys: one column per slot */}
      <div className="flex gap-2">
        {slots.map((item, i) => {
          const f = feedback[i]
          const key = item ? (keyMap[item.rank] ?? '??') : null

          return (
            <div key={i} className="flex flex-col items-center gap-0.5 w-6">
              <SpoilerDot value={f} />
              <span
                className="text-[11px] font-semibold leading-none tabular-nums"
                style={{ color: key ? 'var(--color-text-strong)' : 'var(--color-text-faint)' }}
              >
                {key ?? '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SpoilerDot({ value }) {
  if (value === 'correct' || value === 'present') {
    return (
      <span
        className="text-sm leading-none"
        style={{ color: 'var(--color-dot-correct)' }}
        aria-label="in top 5"
      >
        ●
      </span>
    )
  }
  if (value === 'absent') {
    return (
      <span
        className="text-sm leading-none"
        style={{ color: 'var(--color-dot-present)' }}
        aria-label="not in top 5"
      >
        ○
      </span>
    )
  }
  return (
    <span
      className="text-sm leading-none"
      style={{ color: 'var(--color-dot-absent)', opacity: 0.4 }}
      aria-label="empty"
    >
      ✗
    </span>
  )
}
