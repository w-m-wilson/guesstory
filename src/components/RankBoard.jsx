export default function RankBoard({ rankSlots, lockedSlots, rankHistory, onRemoveSlot, onSubmit }) {
  const hasAnySlot = rankSlots.some(Boolean)

  return (
    <div
      className="shrink-0 px-4 pt-3 pb-2"
      style={{ borderTop: '1px solid var(--color-border)' }}
    >
      {/* Attempt label */}
      <div className="mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-faint)' }}>
          {rankHistory.length === 0 ? 'Arrange your ranking' : `Attempt ${rankHistory.length + 1}`}
        </span>
      </div>

      {/* Slots */}
      <div className="flex flex-col gap-1">
        {rankSlots.map((item, index) => {
          const position = index + 1
          const locked = lockedSlots.includes(index)

          return (
            <div key={index} className="flex items-center gap-2">
              <span
                className="text-sm font-medium w-4 text-right shrink-0"
                style={{ color: locked ? 'var(--color-text-strong)' : 'var(--color-text-faint)' }}
              >
                {position}.
              </span>

              <div
                className="flex-1 flex items-center justify-between rounded-lg px-3 py-1.5 min-w-0"
                style={{
                  background: locked ? 'var(--color-border)' : 'var(--color-bg-elevated)',
                  border: `1px solid ${locked ? 'var(--color-text-faint)' : 'var(--color-border)'}`,
                  minHeight: '36px',
                }}
              >
                {item ? (
                  <>
                    <span
                      className="text-sm truncate"
                      style={{ color: locked ? 'var(--color-text-strong)' : 'var(--color-text)' }}
                    >
                      {item.name}
                      {locked && <span className="ml-1.5 text-xs opacity-50">★</span>}
                    </span>
                    {!locked && (
                      <button
                        onClick={() => onRemoveSlot(index)}
                        className="ml-2 shrink-0 text-xs opacity-30 hover:opacity-80"
                        style={{ color: 'var(--color-text-faint)' }}
                        aria-label={`Remove ${item.name}`}
                      >
                        ✕
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--color-text-faint)', opacity: 0.5 }}>
                    —
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!hasAnySlot}
        className="mt-3 w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-30"
        style={{
          background: hasAnySlot ? 'var(--color-text-strong)' : 'var(--color-bg-elevated)',
          color: hasAnySlot ? 'var(--color-bg)' : 'var(--color-text-faint)',
        }}
      >
        Submit Ranking
      </button>
    </div>
  )
}
