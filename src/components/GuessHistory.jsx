import { useEffect, useRef, useState } from 'react'

const CARD_SPACING = 32   // px between card bottom edges
const PX_PER_CARD  = 52   // px of drag to advance one card
const BOTTOM_PAD   = 8    // px from area bottom to front card bottom
const WHEEL_THRESH = 60   // accumulated deltaY before advancing one card

export default function GuessHistory({ rankHistory, rankSlots, onPickHistoryRow, topInset = 0 }) {
  const hasLiveSlot = rankSlots?.some(Boolean)
  const total = rankHistory.length

  // focusIndex: which card is in the foreground (0=oldest, total-1=latest)
  const [focusIndex, setFocusIndex] = useState(Math.max(0, total - 1))
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(null)
  const wheelAccumRef = useRef(0)

  useEffect(() => {
    if (total > 0) setFocusIndex(total - 1)
  }, [total])

  if (total === 0 && !hasLiveSlot) return null

  function clamp(v) { return Math.max(0, Math.min(total - 1, v)) }
  const effectiveFocus = clamp(focusIndex + dragOffset)

  // drag DOWN (dy > 0) → older cards into focus
  function handlePointerDown(e) {
    if (total <= 1) return
    dragStartY.current = e.clientY
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function handlePointerMove(e) {
    if (!isDragging || dragStartY.current === null) return
    setDragOffset(-(e.clientY - dragStartY.current) / PX_PER_CARD)
  }

  function handlePointerUp(e) {
    if (!isDragging) return
    const dy = e.clientY - (dragStartY.current ?? e.clientY)
    dragStartY.current = null
    setIsDragging(false)
    setDragOffset(0)
    setFocusIndex(prev => clamp(Math.round(prev - dy / PX_PER_CARD)))
  }

  // Accumulate wheel delta — prevents per-event over-sensitivity on trackpads
  // scroll DOWN (deltaY > 0) → older
  function handleWheel(e) {
    e.preventDefault()
    wheelAccumRef.current += e.deltaY
    if (Math.abs(wheelAccumRef.current) >= WHEEL_THRESH) {
      setFocusIndex(prev => clamp(prev - Math.sign(wheelAccumRef.current)))
      wheelAccumRef.current = 0
    }
  }

  return (
    <div
      style={{ position: 'absolute', top: topInset, bottom: 0, left: 0, right: 0, zIndex: 0 }}
      className="flex flex-col"
    >
      <div
        className="flex-1 min-h-0 relative"
        style={{
          overflow: 'hidden',
          cursor: total > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={isDragging ? handlePointerMove : undefined}
        onPointerUp={isDragging ? handlePointerUp : undefined}
        onPointerCancel={isDragging ? handlePointerUp : undefined}
        onWheel={total > 1 ? handleWheel : undefined}
      >
        {rankHistory.map(({ slots, feedback }, i) => {
          // depth 0 = foreground (bottom), positive = older (above, receding over the hill)
          const depth = effectiveFocus - i
          if (depth < -0.5) return null
          const opacity = Math.max(0, 1 - depth * 0.3)
          if (opacity < 0.04) return null

          const bottomPx = BOTTOM_PAD + depth * CARD_SPACING
          const isFocused = i === Math.round(effectiveFocus)

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '12px', right: '12px',
                bottom: `${bottomPx}px`,
                opacity,
                zIndex: Math.round(20 - depth),
                transition: isDragging
                  ? 'none'
                  : 'bottom 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.38s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease',
                cursor: isFocused ? 'default' : 'pointer',
                pointerEvents: opacity < 0.04 ? 'none' : 'auto',
              }}
              onClick={() => {
                if (!isFocused) setFocusIndex(i)
                else onPickHistoryRow?.(slots)
              }}
            >
              <AttemptRow slots={slots} feedback={feedback} attemptNumber={i + 1} isFocused={isFocused} />
            </div>
          )
        })}

        {/* Fade older cards into the rank section above */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '38%',
          background: 'linear-gradient(to bottom, var(--color-bg) 15%, transparent)',
          pointerEvents: 'none', zIndex: 30,
        }} />
      </div>

      {hasLiveSlot && (
        <div className="shrink-0 z-20 border-t" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <LiveRow slots={rankSlots} />
        </div>
      )}
    </div>
  )
}

function AttemptRow({ slots, feedback, attemptNumber, isFocused }) {
  const sortedFeedback = [...feedback].sort((a, b) => {
    const order = { correct: 0, present: 1 }
    return (order[a] ?? 2) - (order[b] ?? 2)
  })
  const correctCount = feedback.filter(f => f === 'correct').length
  const accentColor  = correctCount === 5
    ? 'var(--color-dot-correct)'
    : correctCount > 0 ? 'var(--color-dot-present)' : 'var(--color-border)'
  const names = slots.map(s => s?.name ?? '—')

  return (
    <div style={{
      background: isFocused ? 'var(--color-bg-elevated)' : 'transparent',
      borderRadius: '8px',
      borderLeft: `3px solid ${accentColor}`,
      padding: '5px 8px',
      display: 'flex', alignItems: 'center', gap: '6px',
      transition: 'background 0.38s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <span className="tabular-nums shrink-0" style={{ fontSize: '9px', color: 'var(--color-text-faint)', width: '0.9rem', textAlign: 'right' }}>
        {attemptNumber}
      </span>
      <div className="flex-1 min-w-0 flex items-center" style={{ overflow: 'hidden' }}>
        {names.map((name, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="shrink-0" style={{ fontSize: '13px', color: 'var(--color-text-faint)', padding: '0 4px' }}>·</span>}
            <span className="min-w-0" style={{
              fontSize: '13px',
              color: 'var(--color-text)',
              whiteSpace: 'nowrap', overflow: 'hidden', flexShrink: 1,
              WebkitMaskImage: 'linear-gradient(to right, black 24px, transparent 44px)',
              maskImage: 'linear-gradient(to right, black 24px, transparent 44px)',
            }}>{name}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center shrink-0">
        {sortedFeedback.map((f, i) => (
          <span key={i} style={{
            fontSize: '13px', lineHeight: 1,
            width: '15px', textAlign: 'center', display: 'inline-block',
            color: f === 'correct' ? 'var(--color-dot-correct)' : f === 'present' ? 'var(--color-dot-present)' : 'var(--color-text-faint)',
            opacity: f !== 'correct' && f !== 'present' ? 0.2 : 1,
          }}>
            {f === 'correct' ? '●' : f === 'present' ? '○' : '—'}
          </span>
        ))}
      </div>
    </div>
  )
}

function LiveRow({ slots }) {
  const names = slots.filter(Boolean).map(s => s.name)
  return (
    <div style={{
      background: 'var(--color-bg-elevated)', borderRadius: '8px',
      borderLeft: '3px solid var(--color-border)', padding: '5px 8px',
      margin: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.45,
    }}>
      <span style={{ width: '0.9rem', flexShrink: 0 }} />
      <div className="flex-1 min-w-0 flex items-center" style={{ overflow: 'hidden' }}>
        {names.length === 0
          ? <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>·····</span>
          : names.map((name, i) => (
            <span key={i} style={{ display: 'contents' }}>
              {i > 0 && <span className="shrink-0" style={{ fontSize: '13px', color: 'var(--color-text-faint)', padding: '0 4px' }}>·</span>}
              <span className="min-w-0" style={{
                fontSize: '13px', color: 'var(--color-text)',
                whiteSpace: 'nowrap', overflow: 'hidden', flexShrink: 1,
                WebkitMaskImage: 'linear-gradient(to right, black 24px, transparent 44px)',
                maskImage: 'linear-gradient(to right, black 24px, transparent 44px)',
              }}>{name}</span>
            </span>
          ))
        }
      </div>
      <div className="flex items-center shrink-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ fontSize: '13px', lineHeight: 1, width: '16px', textAlign: 'center', display: 'inline-block', color: 'var(--color-text-faint)', opacity: 0.3 }}>·</span>
        ))}
      </div>
    </div>
  )
}
