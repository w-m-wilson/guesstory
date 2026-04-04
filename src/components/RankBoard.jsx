import { useState, useRef } from 'react'

const LONG_PRESS_MS = 275

export default function RankBoard({ rankSlots, lockedSlots, onRemoveSlot, onMoveSlot, onSubmit }) {
  const hasAnySlot = rankSlots.some(Boolean)
  const [dragIndex, setDragIndex] = useState(null)
  const [chargingIndex, setChargingIndex] = useState(null)
  // Tracks in-flight pointer state for long-press detection
  const pressRef = useRef({ timer: null, startX: 0, startY: 0, dragging: false })

  function startDrag(fromIndex) {
    pressRef.current.dragging = true
    setChargingIndex(null)
    let currentFrom = fromIndex
    setDragIndex(fromIndex)

    function onMove(me) {
      me.preventDefault()
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
      pressRef.current.dragging = false
      setDragIndex(null)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
    }

    document.addEventListener('pointermove', onMove, { passive: false })
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  function handleCardPointerDown(e, index) {
    e.preventDefault()
    const p = pressRef.current
    p.startX = e.clientX
    p.startY = e.clientY
    p.dragging = false
    p.timer = setTimeout(() => {
      p.timer = null
      startDrag(index)
    }, LONG_PRESS_MS)
    setChargingIndex(index)
  }

  function cancelPress() {
    const p = pressRef.current
    if (p.timer) { clearTimeout(p.timer); p.timer = null }
    setChargingIndex(null)
  }

  function handleCardPointerMove(e) {
    if (!pressRef.current.timer) return
    const dx = e.clientX - pressRef.current.startX
    const dy = e.clientY - pressRef.current.startY
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) cancelPress()
  }

  function handleCardPointerUp(index) {
    if (pressRef.current.dragging) return
    if (pressRef.current.timer) {
      cancelPress()
      onRemoveSlot(index)
    }
  }

  return (
    <div
      className="shrink-0 px-4 pt-3 pb-2"
      style={{ borderTop: '1px solid var(--color-border)' }}
    >
      {/* Slots */}
      <div
        className="flex flex-col gap-1"
        style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {rankSlots.map((item, index) => {
          const position = index + 1
          const locked = lockedSlots.includes(index)
          const isDragging = dragIndex === index
          const isCharging = chargingIndex === index
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
                    isDragging || isCharging
                      ? 'var(--color-text)'
                      : locked ? 'var(--color-text-faint)' : 'var(--color-border)'
                  }`,
                  boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.25)' : 'none',
                  minHeight: '36px',
                  opacity: isDragging ? 0.85 : isCharging ? 0.65 : 1,
                  transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                  transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.1s, opacity 0.1s',
                  cursor: isDraggable ? 'pointer' : 'default',
                  position: 'relative',
                  zIndex: isDragging ? 10 : 'auto',
                }}
                onPointerDown={isDraggable ? (e) => handleCardPointerDown(e, index) : undefined}
                onPointerMove={isDraggable ? handleCardPointerMove : undefined}
                onPointerUp={isDraggable ? () => handleCardPointerUp(index) : undefined}
                onPointerCancel={isDraggable ? cancelPress : undefined}
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
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          startDrag(index)
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
