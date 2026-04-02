/**
 * GuessHistory — vertical list of past ranking submissions.
 *
 * Two-column layout per row:
 *   Left:  5 two-letter item keys in submission order
 *   Right: Mastermind feedback dots
 *            ● = in top 5, correct position  ('correct')
 *            ○ = in top 5, wrong position    ('present')
 *            nothing = not in top 5          ('absent' / 'empty')
 *            — = shown when ALL slots give nothing
 */
export default function GuessHistory({ rankHistory, rankSlots, keyMap }) {
  const hasLiveSlot = rankSlots?.some(Boolean)
  if (rankHistory.length === 0 && !hasLiveSlot) return null

  return (
    <div
      className="shrink-0 px-4 py-2 relative"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      {/* Top fade — only appears once enough attempts push older ones out of view */}
      {rankHistory.length > 5 && (
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: '2rem',
            background: 'linear-gradient(to bottom, var(--color-bg), transparent)',
          }}
        />
      )}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: '9rem' }}
      >
        <div className="flex flex-col gap-1">
          {rankHistory.map(({ slots, feedback }, attemptIndex) => (
            <AttemptRow
              key={attemptIndex}
              slots={slots}
              feedback={feedback}
              keyMap={keyMap}
              attemptNumber={attemptIndex + 1}
            />
          ))}
          {hasLiveSlot && (
            <LiveRow slots={rankSlots} keyMap={keyMap} />
          )}
        </div>
      </div>
    </div>
  )
}

function LiveRow({ slots, keyMap }) {
  return (
    <div className="flex items-center gap-2" style={{ opacity: 0.4 }}>
      <span
        className="text-[10px] font-medium w-5 shrink-0"
        style={{ color: 'var(--color-text-faint)' }}
      >
        →
      </span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {slots.map((item, i) => {
          const key = item ? (keyMap[item.rank] ?? '??') : '—'
          return (
            <span
              key={i}
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: item ? 'var(--color-text)' : 'var(--color-text-faint)' }}
            >
              {key}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function AttemptRow({ slots, feedback, keyMap, attemptNumber }) {
  const hasAnyHit = feedback.some(f => f === 'correct' || f === 'present')

  return (
    <div className="flex items-center gap-2 fade-in">
      {/* Attempt number */}
      <span
        className="text-[10px] font-medium w-5 shrink-0 tabular-nums"
        style={{ color: 'var(--color-text-faint)' }}
      >
        #{attemptNumber}
      </span>

      {/* Left column: submitted keys in order */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {slots.map((item, i) => {
          const key = item ? (keyMap[item.rank] ?? '??') : '—'
          return (
            <span
              key={i}
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: 'var(--color-text)' }}
            >
              {key}
            </span>
          )
        })}
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
    </div>
  )
}
