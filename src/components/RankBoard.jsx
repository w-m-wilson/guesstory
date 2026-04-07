import { useState, useRef, useEffect } from 'react'


export default function RankBoard({ rankSlots, lockedSlots, onRemoveSlot, onMoveSlot, onSubmit }) {
  const hasAnySlot = rankSlots.some(Boolean)
  const allFilled = rankSlots.every(Boolean)
  const [dragIndex, setDragIndex] = useState(null)
  const [submitReadyKey, setSubmitReadyKey] = useState(0)
  const prevAllFilled = useRef(false)
  const pressRef = useRef({ dragging: false })

  // Pulse the submit button once when all slots fill for the first time
  useEffect(() => {
    if (allFilled && !prevAllFilled.current) {
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
      className="shrink-0 px-4 pt-2 pb-2"
      style={{
        position: 'relative',
        zIndex: 10,
        background: 'var(--color-bg)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: 'var(--color-text-faint)', opacity: 0.5 }}>
          Rank
        </p>
        <span className="text-[9px] font-mono" style={{ color: 'var(--color-text-faint)', opacity: 0.45 }} aria-hidden="true">
          <span style={{ color: 'var(--color-dot-correct)' }}>●</span>
          {' '}right
          {'\u00A0\u00A0'}
          <span style={{ color: 'var(--color-dot-present)' }}>○</span>
          {' '}wrong spot
          {'\u00A0\u00A0'}
          <span>—</span>
          {' '}not in top 5
        </span>
      </div>
      {/* Slots */}
      <div
        className="flex flex-col gap-1"
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
                className="text-sm font-medium w-4 text-right shrink-0"
                style={{ color: locked ? 'var(--color-text-strong)' : 'var(--color-text-faint)' }}
              >
                {position}.
              </span>

              <div
                className="flex-1 flex items-center rounded-lg px-3 py-1.5 min-w-0"
                style={{
                  background: isDragging
                    ? 'var(--color-bg)'
                    : locked ? 'var(--color-border)' : 'var(--color-bg-elevated)',
                  border: `1px solid ${
                    isDragging
                      ? 'var(--color-text)'
                      : locked ? 'var(--color-text-faint)' : 'var(--color-border)'
                  }`,
                  boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.25)' : 'none',
                  minHeight: '36px',
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
                          color: isDragging ? 'var(--color-text)' : 'var(--color-text-faint)',
                          cursor: isDragging ? 'grabbing' : 'grab',
                          opacity: isDragging ? 1 : 0.55,
                          transition: 'opacity 0.1s, color 0.1s',
                          fontSize: '1.25rem',
                          lineHeight: 1,
                          padding: '4px 6px',
                          margin: '-4px -4px -4px 2px',
                          touchAction: 'none',
                        }}
                        aria-hidden="true"
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
        key={submitReadyKey}
        onClick={onSubmit}
        disabled={!hasAnySlot}
        className={`mt-3 w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-30${allFilled && submitReadyKey > 0 ? ' submit-ready' : ''}`}
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
