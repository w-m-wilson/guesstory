import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { modalScrimBackground } from '../utils/modalScrim.js'

function sortFeedbackForDots(feedback) {
  return [...feedback].sort((a, b) => {
    const order = { correct: 0, present: 1 }
    return (order[a] ?? 2) - (order[b] ?? 2)
  })
}

function ScoreExplainerPopup({ feedback, onClose }) {
  const sortedFeedback = sortFeedbackForDots(feedback)
  const correctCount = feedback.filter(f => f === 'correct').length
  const presentCount = feedback.filter(f => f === 'present').length
  const topFiveCount = correctCount + presentCount
  const absentCount  = 5 - topFiveCount

  let message
  if (correctCount === 5) {
    message = 'All 5 items are in exactly the right spot — perfect score!'
  } else if (topFiveCount === 0) {
    message = `None of your 5 guesses are in the top 5. Try completely different items.`
  } else {
    const inTop5Part = topFiveCount === 1
      ? `1 of your guesses is somewhere in the top 5`
      : `${topFiveCount} of your guesses are somewhere in the top 5`
    const rightSpotPart = correctCount === 0
      ? `but none are in the right spot yet`
      : correctCount === 1
        ? `and 1 is in exactly the right spot`
        : `and ${correctCount} are in exactly the right spot`
    const absentPart = absentCount === 0
      ? ``
      : absentCount === 1
        ? ` The other 1 isn't in the top 5 at all.`
        : ` The other ${absentCount} aren't in the top 5 at all.`
    message = `${inTop5Part}, ${rightSpotPart}.${absentPart} The dots don't tell you which items are which — just the counts.`
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-explainer-title"
      className="fixed inset-0 z-[55] flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: -1, background: modalScrimBackground({ variant: 'dialog' }), pointerEvents: 'none' }} />
      <div
        className="w-full max-w-xs rounded-2xl p-5 fade-in"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-center gap-0.5 rounded-xl px-3 py-3 mb-4"
          style={{ background: 'var(--color-bg-elevated)' }}
          role="img"
          aria-label={`Score feedback: ${correctCount} in the right spot, ${presentCount} in the top five but wrong spot, ${absentCount} not in the top five`}
        >
          {sortedFeedback.map((f, i) => (
            <span
              key={i}
              style={{
                fontSize: '22px',
                lineHeight: 1,
                width: '1.35rem',
                textAlign: 'center',
                display: 'inline-block',
                color: f === 'correct' ? 'var(--color-dot-correct)' : f === 'present' ? 'var(--color-dot-present)' : 'var(--color-text-faint)',
                opacity: f !== 'correct' && f !== 'present' ? 0.22 : 1,
              }}
            >
              {f === 'correct' ? '●' : f === 'present' ? '○' : '—'}
            </span>
          ))}
        </div>
        <p id="score-explainer-title" className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-strong)' }}>What this score means</p>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text)' }}>{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
        >
          Got it
        </button>
      </div>
    </div>,
    document.body,
  )
}

const CARD_SPACING = 32   // px between card bottom edges
const PX_PER_CARD  = 52   // px of drag to advance one card
const BOTTOM_PAD   = 8    // px from area bottom to front card bottom
const WHEEL_THRESH = 60   // accumulated deltaY before advancing one card

const FIRST_REAL_FEEDBACK_EXPLAINER_KEY = 'guesstory-first-real-feedback-explainer'

function readFirstRealFeedbackExplainerSeen() {
  try {
    return !!localStorage.getItem(FIRST_REAL_FEEDBACK_EXPLAINER_KEY)
  } catch {
    return true
  }
}

function markFirstRealFeedbackExplainerSeen() {
  try {
    localStorage.setItem(FIRST_REAL_FEEDBACK_EXPLAINER_KEY, '1')
  } catch { /* ignore */ }
}

export default function GuessHistory({ rankHistory, rankSlots, onPickHistoryRow, topInset = 0, isTutorial = false }) {
  const hasLiveSlot = rankSlots?.some(Boolean)
  const total = rankHistory.length

  // focusIndex: which card is in the foreground (0=oldest, total-1=latest)
  const [focusIndex, setFocusIndex] = useState(Math.max(0, total - 1))
  const [explainerFeedback, setExplainerFeedback] = useState(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(null)
  const wheelAccumRef = useRef(0)

  useEffect(() => {
    if (total > 0) setFocusIndex(total - 1)
  }, [total])

  useEffect(() => {
    if (isTutorial) return
    if (readFirstRealFeedbackExplainerSeen()) return
    if (rankHistory.length >= 2) {
      markFirstRealFeedbackExplainerSeen()
      setExplainerFeedback(null)
    }
  }, [isTutorial, rankHistory.length])

  useEffect(() => {
    if (isTutorial) return
    if (readFirstRealFeedbackExplainerSeen()) return
    if (rankHistory.length !== 1) return
    const fb = rankHistory[0]?.feedback
    if (!fb || fb.length !== 5) return
    setExplainerFeedback(fb)
  }, [isTutorial, rankHistory])

  function closeScoreExplainer() {
    setExplainerFeedback(null)
    if (!isTutorial) markFirstRealFeedbackExplainerSeen()
  }

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
              <AttemptRow slots={slots} feedback={feedback} attemptNumber={i + 1} isFocused={isFocused} onShowExplainer={setExplainerFeedback} />
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
        <div className="shrink-0 z-20" style={{ background: 'var(--color-bg)', marginTop: '-4px', marginBottom: '8px' }}>
          <LiveRow slots={rankSlots} />
        </div>
      )}
      {explainerFeedback && (
        <ScoreExplainerPopup feedback={explainerFeedback} onClose={closeScoreExplainer} />
      )}
    </div>
  )
}

/** Opaque on the left; soft fade only on the right edge (no left-side dimming). */
const NAME_FADE_MASK = 'linear-gradient(to right, black 0%, black calc(100% - 14px), transparent 100%)'

/** Five equal columns (#1–#5): strict alignment; long names fade at clipped edges (no ellipsis). */
function HistoryRankNamesTrack({ slots, variant }) {
  const isLive = variant === 'live'
  const cells = Array.from({ length: 5 }, (_, i) => slots[i] ?? null)
  return (
    <div
      className="min-w-0 flex-1"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        alignItems: 'center',
        columnGap: '6px',
        marginInlineEnd: '14px',
      }}
    >
      {cells.map((slot, i) => {
        const label = slot?.name
        const placeholder = isLive ? '·' : '—'
        return (
          <div
            key={i}
            title={label ?? undefined}
            style={{
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                width: '100%',
                fontSize: '13px',
                lineHeight: 1.25,
                color: label ? 'var(--color-text)' : 'var(--color-text-faint)',
                opacity: label ? 1 : (isLive ? 0.5 : 0.85),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textAlign: 'center',
                WebkitMaskImage: label ? NAME_FADE_MASK : 'none',
                maskImage: label ? NAME_FADE_MASK : 'none',
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
              }}
            >
              {label ?? placeholder}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function AttemptRow({ slots, feedback, attemptNumber, isFocused, onShowExplainer }) {
  const sortedFeedback = sortFeedbackForDots(feedback)
  const correctCount = feedback.filter(f => f === 'correct').length
  const accentColor  = correctCount === 5
    ? 'var(--color-dot-correct)'
    : correctCount > 0 ? 'var(--color-dot-present)' : 'var(--color-border)'

  return (
    <>
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
        <HistoryRankNamesTrack slots={slots} variant="history" />
        <button
          onClick={e => { e.stopPropagation(); onShowExplainer(feedback) }}
          className="flex items-center shrink-0"
          aria-label="What does this score mean?"
        >
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
        </button>
      </div>
    </>
  )
}

function LiveRow({ slots }) {
  return (
    <div style={{
      background: 'var(--color-bg-elevated)', borderRadius: '8px',
      borderLeft: '3px solid var(--color-border)', padding: '5px 8px',
      margin: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.45,
    }}>
      <span style={{ width: '0.9rem', flexShrink: 0 }} />
      <HistoryRankNamesTrack slots={slots} variant="live" />
      <div className="flex items-center shrink-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ fontSize: '13px', lineHeight: 1, width: '16px', textAlign: 'center', display: 'inline-block', color: 'var(--color-text-faint)', opacity: 0.3 }}>·</span>
        ))}
      </div>
    </div>
  )
}
