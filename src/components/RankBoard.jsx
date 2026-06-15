import { useRef, useEffect, useState } from 'react'

export default function RankBoard({ rankSlots, lockedSlots, onRemoveSlot, onMoveSlot, onSubmit, tutorialStep }) {
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
      className="shrink-0 px-2 pt-1 pb-1"
      style={{
        position: 'relative',
        zIndex: 10,
        background: 'var(--color-bg)',
      }}
    >
      {/* Slots */}
      <div
        className="flex flex-col gap-1.5"
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
              className="flex items-center gap-1.5"
              style={{ touchAction: isDraggable ? 'none' : 'auto' }}
            >
              <span
                className="bit-circle shrink-0 flex items-center justify-center"
                style={{
                  fontSize: '0.7rem',
                  lineHeight: 1,
                  fontWeight: 700,
                  color: 'var(--color-action-text)',
                  background: 'var(--color-dot-present)',
                  width: '1.4rem',
                  height: '1.4rem',
                  opacity: item ? 1 : 0.35,
                  flexShrink: 0,
                }}
              >
                {position}
              </span>

              <div
                className="flex-1 min-w-0"
                style={{
                  filter: isDragging
                    ? 'var(--shadow-raised-lg)'
                    : item && !locked
                      ? 'var(--shadow-raised)'
                      : 'none',
                  transform: isDragging ? 'scale(1.03)' : 'scale(1)',
                  transition: 'transform 0.1s',
                  position: 'relative',
                  zIndex: isDragging ? 10 : 'auto',
                }}
              >
              <div
                className="flex items-center bit-input px-3 py-1.5 min-w-0"
                style={{
                  background: locked
                    ? 'var(--color-border)'
                    : item
                      ? 'var(--elev-raised-bg)'
                      : 'var(--elev-empty-bg)',
                  border: 'none',
                  boxShadow: !item ? 'var(--inset-empty)' : 'none',
                  minHeight: '32px',
                  opacity: isDragging ? 0.85 : 1,
                  transition: 'box-shadow 0.15s, border-color 0.15s, opacity 0.1s',
                  cursor: isDraggable ? 'pointer' : 'default',
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
                      {item.display ?? item.name}
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
                              borderRadius: '0',
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
                ) : null}
              </div>
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
        className={`mt-4 w-full py-1.5 bit-btn text-sm font-semibold disabled:opacity-30${allFilled && submitReadyKey > 0 ? ' submit-ready' : ''}${tutorialStep === 3 && allFilled ? ' tutorial-pulse' : ''}`}
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
