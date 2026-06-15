import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDrag, useWheel } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'
import { modalScrimBackground } from '../utils/modalScrim.js'
import ChamferedSurface from './primitives/ChamferedSurface.jsx'

function sortFeedbackForDots(feedback) {
  return [...feedback].sort((a, b) => {
    const order = { correct: 0, present: 1 }
    return (order[a] ?? 2) - (order[b] ?? 2)
  })
}

function feedbackChipStyle(f) {
  if (f === 'correct') {
    return {
      background: 'color-mix(in srgb, var(--color-dot-correct) 85%, var(--color-bg))',
      boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.38)',
    }
  }
  if (f === 'present') {
    return {
      background: 'color-mix(in srgb, var(--color-dot-present) 70%, var(--color-bg))',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.24)',
    }
  }
  return {
    background: 'var(--elev-empty-bg)',
    boxShadow: 'var(--inset-empty)',
  }
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
    message = `${inTop5Part}, ${rightSpotPart}.${absentPart} The chips don't tell you which items are which — just the counts.`
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-explainer-title"
      className="fixed inset-0 z-[55] flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: modalScrimBackground({ variant: 'dialog' }), pointerEvents: 'none' }} />
      <ChamferedSurface
        shadow="dialog"
        bg="var(--color-bg)"
        style={{ position: 'relative', zIndex: 1 }}
        innerClassName="w-full max-w-xs p-5 fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-center gap-[4px] px-3 py-3 mb-4"
          style={{ background: 'var(--color-bg-elevated)', clipPath: CHAMFER_CLIP }}
          role="img"
          aria-label={`Score feedback: ${correctCount} in the right spot, ${presentCount} in the top five but wrong spot, ${absentCount} not in the top five`}
        >
          {sortedFeedback.map((f, i) => (
            <div key={i} style={{
              width: '28px', height: '28px',
              clipPath: CHAMFER_CLIP_SM,
              ...feedbackChipStyle(f),
            }} />
          ))}
        </div>
        <p id="score-explainer-title" className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-strong)' }}>What this score means</p>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text)' }}>{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 text-sm font-semibold"
          style={{ background: 'var(--color-action)', color: 'var(--color-action-text)', clipPath: CHAMFER_CLIP }}
        >
          Got it
        </button>
      </ChamferedSurface>
    </div>,
    document.body,
  )
}

const PX_PER_CARD  = 40   // px of drag to advance one card
const WHEEL_THRESH = 48   // accumulated deltaY before advancing one card
// Snappy settle: high tension + critically-damped friction. Keeps the spring
// feeling crisp on low-refresh-rate displays where every frame counts.
const SPRING_CONFIG = { tension: 520, friction: 32, clamp: false, precision: 0.005 }

const CHAMFER_CLIP = 'var(--chamfer-6)'
const CHAMFER_CLIP_SM = 'var(--chamfer-3)'

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

export default function GuessHistory({ rankHistory, rankSlots, onPickHistoryRow, isTutorial = false }) {
  const hasLiveSlot = rankSlots?.some(Boolean)
  const total = rankHistory.length

  // focusIndex is the "settled" integer used for React render decisions
  // (which card is data-focused, click-to-restore target). The visual position
  // is driven by a SpringValue (`focus`) that bypasses React renders entirely.
  const [focusIndex, setFocusIndex] = useState(Math.max(0, total - 1))
  const [explainerFeedback, setExplainerFeedback] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const stackRef = useRef(null)
  const wheelAccumRef = useRef(0)
  const lastTickRef = useRef(focusIndex)
  const totalRef = useRef(total)
  totalRef.current = total
  const [prevTotal, setPrevTotal] = useState(total)

  // Factory form keeps the spring instance stable across renders. We never
  // call api.start() during render — only from event handlers and effects.
  const [{ focus }, api] = useSpring(() => ({
    focus: focusIndex,
    config: SPRING_CONFIG,
    onChange: ({ value }) => {
      const r = Math.round(value.focus)
      if (r !== lastTickRef.current && r >= 0 && r <= totalRef.current - 1) {
        lastTickRef.current = r
        try { navigator.vibrate?.(6) } catch { /* ignore */ }
      }
    },
  }))

  // Re-target the spring whenever React-tracked focusIndex changes (new guess
  // bumps it; click-to-restore sets it). Effect, not render-time, so R19's
  // double-render in dev doesn't fire imperative API calls twice.
  useEffect(() => {
    api.start({ focus: focusIndex })
  }, [focusIndex, api])

  // Adjust state during render when total changes — preferred over useEffect+setState
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  if (prevTotal !== total) {
    setPrevTotal(total)
    if (total > 0) {
      setFocusIndex(total - 1)
      lastTickRef.current = total - 1
    }
    if (!isTutorial && !readFirstRealFeedbackExplainerSeen()) {
      if (total === 1) {
        const fb = rankHistory[0]?.feedback
        if (fb?.length === 5) setExplainerFeedback(fb)
      } else if (total >= 2) {
        markFirstRealFeedbackExplainerSeen()
        setExplainerFeedback(null)
      }
    }
  }

  function closeScoreExplainer() {
    setExplainerFeedback(null)
    if (!isTutorial) markFirstRealFeedbackExplainerSeen()
  }

  function clamp(v) { return Math.max(0, Math.min(total - 1, v)) }

  // useDrag handles velocity, tap-vs-drag, pointer capture, and (with `bounds`
  // + `rubberband`) elastic resistance at the ends. We feed `movement[1]` into
  // the spring during the drag and a velocity-projected target on release.
  const bindDrag = useDrag(
    ({ down, movement: [, my], velocity: [, vy], direction: [, dy], tap, first }) => {
      if (tap || total <= 1) return
      if (first && typeof document !== 'undefined') document.activeElement?.blur?.()
      setIsDragging(down)

      const delta = -my / PX_PER_CARD
      if (down) {
        // Follow the finger directly. `bounds` + `rubberband` below clamp `my`
        // before we ever see it, so we don't redo the elastic math here.
        api.start({ focus: focusIndex + delta, immediate: true })
      } else {
        // Velocity is unsigned px/ms; multiply by direction to recover sign.
        const projectedCards = -dy * vy * 200 / PX_PER_CARD
        const next = clamp(Math.round(focusIndex + delta + projectedCards))
        setFocusIndex(next)
        api.start({ focus: next, immediate: false, config: SPRING_CONFIG })
      }
    },
    {
      axis: 'y',
      filterTaps: true,
      rubberband: 0.15,
      bounds: () => ({
        top:    -(total - 1 - focusIndex) * PX_PER_CARD,
        bottom: focusIndex * PX_PER_CARD,
      }),
    },
  )

  // When `target` is set, useWheel auto-attaches via internal effect and the
  // return value is unused — do NOT call it.
  useWheel(
    ({ event, delta: [, dyW] }) => {
      event.preventDefault?.()
      if (total <= 1) return
      wheelAccumRef.current += dyW
      if (Math.abs(wheelAccumRef.current) >= WHEEL_THRESH) {
        const step = Math.sign(wheelAccumRef.current)
        wheelAccumRef.current = 0
        setFocusIndex(prev => {
          const next = clamp(prev - step)
          if (next !== prev) api.start({ focus: next })
          return next
        })
      }
    },
    { target: stackRef, eventOptions: { passive: false } },
  )

  // Early-return AFTER every hook call so the hook order stays stable across
  // renders. Returning null before useDrag/useWheel would change the hook
  // count once hasLiveSlot flips, which crashes React.
  if (total === 0 && !hasLiveSlot) return null

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <animated.div
        ref={stackRef}
        className="absolute inset-0"
        {...bindDrag()}
        style={{
          overflow: 'hidden',
          cursor: total > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
          userSelect: 'none',
          // Reserve room for the active bar so the focused card doesn't sit
          // under it. Stays constant whether LiveRow is rendered or not so
          // the stack doesn't reflow when the user clears all slots.
          '--stack-bottom': hasLiveSlot ? '52px' : '8px',
          // The SpringValue writes --effective-focus straight to the DOM each
          // frame; React never re-renders for visual updates.
          '--effective-focus': focus,
        }}
      >
        {rankHistory.map(({ slots, feedback }, i) => {
          // No culling: during drag, --effective-focus moves without a React
          // re-render, so any cull keyed off React's focusIndex would leave
          // distant cards unmounted and pop them in on release.
          const isFocused = i === focusIndex

          return (
            <div
              key={i}
              className="attempt-card"
              data-focused={isFocused || undefined}
              data-ahead={i > focusIndex || undefined}
              style={{ '--card-index': i }}
              onClick={() => {
                if (!isFocused) { setFocusIndex(i); hapticTick() }
                else onPickHistoryRow?.(slots)
              }}
            >
              <AttemptRow slots={slots} feedback={feedback} attemptNumber={i + 1} isFocused={isFocused} onShowExplainer={setExplainerFeedback} />
            </div>
          )
        })}

        {/* Fade older cards into the rank section above */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '22%',
          background: 'linear-gradient(to bottom, var(--color-bg) 25%, transparent)',
          pointerEvents: 'none', zIndex: 30,
        }} />
      </animated.div>

      {hasLiveSlot && (
        <div
          className="absolute left-0 right-0"
          style={{ bottom: '8px', zIndex: 40, background: 'var(--color-bg)' }}
        >
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

const AttemptRow = memo(function AttemptRow({ slots, feedback, attemptNumber, isFocused, onShowExplainer }) {
  const sortedFeedback = sortFeedbackForDots(feedback)
  const correctCount = feedback.filter(f => f === 'correct').length
  const accentColor  = correctCount === 5
    ? 'var(--color-dot-correct)'
    : correctCount > 0 ? 'var(--color-dot-present)' : 'var(--color-border)'

  return (
    <>
      <div style={{
        // --focus-strength inherits from .attempt-card; peaks at 1 when this
        // card is at depth=0 and fades to 0 by |depth|=1, so the highlight
        // flows continuously with the spring instead of snapping on settle.
        background: 'color-mix(in srgb, var(--color-bg-raised) calc(var(--focus-strength) * 100%), transparent)',
        clipPath: CHAMFER_CLIP,
        padding: '5px 8px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span className="shrink-0" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-faint)', width: '0.9rem', textAlign: 'right' }}>
          {attemptNumber}
        </span>
        <HistoryRankNamesTrack slots={slots} variant="history" />
        <button
          onClick={e => { e.stopPropagation(); onShowExplainer(feedback) }}
          className="flex items-center shrink-0 gap-[3px]"
          aria-label="What does this score mean?"
        >
          {sortedFeedback.map((f, i) => (
            <div key={i} style={{
              width: '18px', height: '20px',
              clipPath: CHAMFER_CLIP_SM,
              ...feedbackChipStyle(f),
            }} />
          ))}
        </button>
      </div>
    </>
  )
})

function LiveRow({ slots }) {
  return (
    <div style={{
      background: 'var(--elev-empty-bg)',
      clipPath: CHAMFER_CLIP,
      border: '1px solid color-mix(in srgb, var(--color-text) 22%, var(--color-bg))',
      boxShadow: 'var(--inset-empty)',
      padding: '5px 8px',
      margin: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7,
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
