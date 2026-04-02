import { useState } from 'react'

export default function RankBoard({ rankSlots, lockedSlots, rankHistory, onRemoveSlot, onMoveSlot, onSubmit }) {
  const hasAnySlot = rankSlots.some(Boolean)
  const [dragIndex, setDragIndex] = useState(null)

  function startDrag(fromIndex, e) {
    e.preventDefault()
    let currentFrom = fromIndex
    setDragIndex(fromIndex)

    function onMove(me) {
      const target = document.elementFromPoint(me.clientX, me.clientY)
      const row = target?.closest('[data-slot-index]')
      if (!row) return
      const toIndex = parseInt(row.dataset.slotIndex, 10)
      if (toIndex === currentFrom) return
      if (lockedSlots.includes(currentFrom) || lockedSlots.includes(toIndex)) return
      onMoveSlot(currentFrom, toIndex)
      currentFrom = toIndex
      setDragIndex(toIndex)
    }

    function onUp() {
      setDragIndex(null)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

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
          const isDragging = dragIndex === index
          const isDraggable = !locked && item !== null

          return (
            <div
              key={index}
              data-slot-index={index}
              className="flex items-center gap-2"
            >
              <span
                className="text-sm font-medium w-4 text-right shrink-0"
                style={{ color: locked ? 'var(--color-text-strong)' : 'var(--color-text-faint)' }}
              >
                {position}.
              </span>

              <div
                className="flex-1 flex items-center rounded-lg px-3 py-1.5 min-w-0"
                style={{
                  background: locked ? 'var(--color-border)' : 'var(--color-bg-elevated)',
                  border: `1px solid ${locked ? 'var(--color-text-faint)' : 'var(--color-border)'}`,
                  minHeight: '36px',
                  opacity: isDragging ? 0.4 : 1,
                  transition: 'opacity 0.1s',
                  cursor: isDraggable ? 'pointer' : 'default',
                }}
                onClick={isDraggable ? () => onRemoveSlot(index) : undefined}
              >
                {item ? (
                  <>
                    <span
                      className="text-sm truncate flex-1"
                      style={{ color: locked ? 'var(--color-text-strong)' : 'var(--color-text)' }}
                    >
                      {item.name}
                      {locked && <span className="ml-1.5 text-xs opacity-50">★</span>}
                    </span>
                    {isDraggable && (
                      <span
                        className="shrink-0 ml-2 text-sm select-none"
                        style={{
                          color: 'var(--color-text-faint)',
                          cursor: isDragging ? 'grabbing' : 'grab',
                          opacity: 0.4,
                          touchAction: 'none',
                        }}
                        aria-hidden="true"
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          startDrag(index, e)
                        }}
                      >⠿</span>
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
