import { useState, useRef, useEffect } from 'react'


export default function RankBoard({ rankSlots, lockedSlots, onRemoveSlot, onMoveSlot, onSubmit }) {
  const filledCount = rankSlots.filter(Boolean).length
  const hasAnySlot = filledCount > 0
  const hasMinItems = filledCount >= 5
  const allFilled = rankSlots.every(Boolean)
  const [dragIndex, setDragIndex] = useState(null)
  const [submitReadyKey, setSubmitReadyKey] = useState(0)
  const prevAllFilled = useRef(false)
  const pressRef = useRef({ dragging: false })

  // Pulse the submit button once when all slots fill for the first time
  useEffect(() => {
    if (allFilled && !prevAllFilled.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmitReadyKey(k => k + 1)
    }
    prevAllFilled.current = allFilled
  }, [allFilled])

  function startDrag(fromIndex, { onTap } = {}) {
    pressRef.current.dragging = true
    let currentFrom = fromIndex
    let hasMoved = false
    setDragIndex(fromIndex)

    function onMove(me) {
      me.preventDefault()
      const target = document.elementFromPoint(me.clientX, me.clientY)
      const row = target?.closest('[data-slot-index]')
      if (!row) return
      const toIndex = parseInt(row.dataset.slotIndex, 10)
      if (toIndex === currentFrom) return
      if (lockedSlots.includes(currentFrom) || lockedSlots.includes(toIndex)) return
      hasMoved = true
      onMoveSlot(currentFrom, toIndex)
      currentFrom = toIndex
      setDragIndex(toIndex)
    }

    function onUp() {
      pressRef.current.dragging = false
      setDragIndex(null)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      if (!hasMoved && onTap) onTap()
    }

    document.addEventListener('pointermove', onMove, { passive: false })
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  return (
    <div
      className="shrink-0 px-4 pt-1.5 pb-2"
      style={{
        position: 'relative',
        zIndex: 10,
        background: 'var(--color-bg-elevated)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between mb-1 gap-3">
        <p className="text-[9px] font-black tracking-widest uppercase shrink-0 pt-px" style={{ color: 'var(--color-text-faint)', opacity: 0.5 }}>
          Rank
        </p>
        <div className="flex gap-3" aria-hidden="true">
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>
            <span style={{ color: 'var(--color-dot-correct)' }}>●</span> right
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>
            <span style={{ color: 'var(--color-dot-present)' }}>○</span> wrong spot
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-faint)' }}>
            <span>—</span> not in top 5
          </span>
        </div>
      </div>
      {/* Slots */}
      <div
        className="flex flex-col gap-0.5"
      >
        {rankSlots.map((item, index) => {
          const position = index + 1
          const locked = lockedSlots.includes(index)
          const isDragging = dragIndex === index
          const isDraggable = !locked && item !== null

          return (
            <div
              key={index}
              data-slot-index={index}
              className="flex items-center gap-2"
              style={{ touchAction: isDraggable ? 'none' : 'auto' }}
            >
              <span
                className="text-sm font-bold tabular-nums shrink-0"
                style={{
                  color: 'var(--color-dot-present)',
                  width: '1.25rem',
                  textAlign: 'right',
                  opacity: item ? 1 : 0.4,
                }}
              >
                {position}
              </span>

              <div
                className="flex-1 flex items-center rounded-lg px-3 py-1.5 min-w-0"
                style={{
                  background: locked ? 'var(--color-border)' : 'var(--color-bg)',
                  ...(item && !isDragging ? {
                    borderTop: `1px solid ${locked ? 'var(--color-text-faint)' : 'var(--color-border)'}`,
                    borderRight: `1px solid ${locked ? 'var(--color-text-faint)' : 'var(--color-border)'}`,
                    borderBottom: `1px solid ${locked ? 'var(--color-text-faint)' : 'var(--color-border)'}`,
                    borderLeft: `3px solid ${locked ? 'var(--color-text-faint)' : 'var(--color-action)'}`,
                  } : {
                    border: `1px solid ${isDragging ? 'var(--color-text)' : locked ? 'var(--color-text-faint)' : 'var(--color-border)'}`,
                  }),
                  boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.25)' : 'none',
                  minHeight: '32px',
                  opacity: isDragging ? 0.85 : 1,
                  transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                  transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.1s, opacity 0.1s',
                  cursor: isDraggable ? 'pointer' : 'default',
                  position: 'relative',
                  zIndex: isDragging ? 10 : 'auto',
                }}
                onPointerDown={isDraggable ? (e) => { e.preventDefault(); startDrag(index, { onTap: () => onRemoveSlot(index) }) } : undefined}
              >
                {item ? (
                  <>
                    <span
                      className="text-sm flex-1 min-w-0 overflow-hidden"
                      style={{
                        color: locked ? 'var(--color-text-strong)' : 'var(--color-text)',
                        WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 18px), transparent 100%)',
                        maskImage: 'linear-gradient(to right, black calc(100% - 18px), transparent 100%)',
                      }}
                    >
                      {item.name}
                      {locked && <span className="ml-1.5 text-xs opacity-50">★</span>}
                    </span>
                    {isDraggable && (
                      <span
                        className="shrink-0 select-none"
                        style={{
                          cursor: isDragging ? 'grabbing' : 'grab',
                          padding: '4px 6px',
                          margin: '-4px -4px -4px 2px',
                          touchAction: 'none',
                          display: 'inline-grid',
                          gridTemplateColumns: 'repeat(2, 3px)',
                          gridTemplateRows: 'repeat(3, 3px)',
                          gap: '2.5px',
                          alignItems: 'center',
                          alignContent: 'center',
                        }}
                        aria-hidden="true"
                      >
                        {Array.from({ length: 6 }).map((_, i) => (
                          <span
                            key={i}
                            style={{
                              width: '3px',
                              height: '3px',
                              borderRadius: '50%',
                              background: isDragging ? 'var(--color-text)' : 'var(--color-text-faint)',
                              opacity: isDragging ? 1 : 0.72,
                              transition: 'background 0.1s, opacity 0.1s',
                              display: 'block',
                            }}
                          />
                        ))}
                      </span>
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
        key={submitReadyKey}
        onClick={onSubmit}
        disabled={!hasMinItems}
        className={`mt-2 w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-30${allFilled && submitReadyKey > 0 ? ' submit-ready' : ''}`}
        style={{
          background: hasMinItems ? 'var(--color-action)' : 'var(--color-border)',
          color: hasMinItems ? 'var(--color-action-text)' : 'var(--color-text-faint)',
        }}
      >
        Submit Ranking
      </button>
    </div>
  )
}
