import { useEffect, useRef, useState } from 'react'

export default function GuessHistory({ rankHistory, rankSlots, onPickHistoryRow, topInset = 0 }) {
  const hasLiveSlot = rankSlots?.some(Boolean)
  const scrollRef = useRef(null)
  const [scrolledPast, setScrolledPast] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrolledPast(el.scrollTop > 4)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [rankHistory.length])

  if (rankHistory.length === 0 && !hasLiveSlot) return null

  return (
    <div
      className="px-4 pt-1 pb-0 flex flex-col min-h-0"
      style={{ position: 'absolute', top: topInset, bottom: 0, left: 0, right: 0, zIndex: 0 }}
    >
      <div className="flex-1 min-h-0 flex flex-col relative">
        {scrolledPast && (
          <div
            className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
            style={{
              height: '2rem',
              background: 'linear-gradient(to bottom, var(--color-bg), transparent)',
            }}
          />
        )}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex flex-col gap-1 justify-end min-h-full">
            <div className="h-1 shrink-0" aria-hidden="true" />
            {rankHistory.map(({ slots, feedback }, attemptIndex) => (
              <AttemptRow
                key={attemptIndex}
                slots={slots}
                feedback={feedback}
                attemptNumber={attemptIndex + 1}
                isLatest={attemptIndex === rankHistory.length - 1}
                onPick={() => onPickHistoryRow?.(slots)}
              />
            ))}
            <div className="h-1 shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>

      {hasLiveSlot && (
        <div
          className="shrink-0 z-20 border-t"
          style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
          <LiveRow slots={rankSlots} />
        </div>
      )}
    </div>
  )
}

const INDENT = '1.5rem' // attempt number column width + gap

function AttemptRow({ slots, feedback, attemptNumber, isLatest, onPick }) {
  const sortedFeedback = [...feedback].sort((a, b) => {
    const order = { correct: 0, present: 1 }
    return (order[a] ?? 2) - (order[b] ?? 2)
  })

  const correctCount = feedback.filter(f => f === 'correct').length
  const accentColor = correctCount === 5
    ? 'var(--color-dot-correct)'
    : correctCount > 0
      ? 'var(--color-dot-present)'
      : 'var(--color-border)'

  const names = slots.map(s => s?.name ?? '—')

  return (
    <button
      type="button"
      className={`w-full text-left cursor-pointer appearance-none border-0 p-0 ${isLatest ? 'attempt-new' : ''}`}
      onClick={onPick}
      style={{
        background: 'var(--color-bg-elevated)',
        borderRadius: '8px',
        borderLeft: `3px solid ${accentColor}`,
        padding: '3px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {/* Attempt number */}
      <span
        className="tabular-nums shrink-0"
        style={{ fontSize: '9px', color: 'var(--color-text-faint)', width: '0.9rem', textAlign: 'right' }}
      >
        {attemptNumber}
      </span>

      {/* Names — each item fades independently if it overflows */}
      <div className="flex-1 min-w-0 flex items-center" style={{ overflow: 'hidden' }}>
        {names.map((name, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && (
              <span className="shrink-0" style={{ fontSize: '13px', color: 'var(--color-text-faint)', padding: '0 1px' }}> · </span>
            )}
            <span
              className="min-w-0"
              style={{
                fontSize: '13px',
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                flexShrink: 1,
                WebkitMaskImage: 'linear-gradient(to right, black 38px, transparent 62px)',
                maskImage: 'linear-gradient(to right, black 38px, transparent 62px)',
              }}
            >
              {name}
            </span>
          </span>
        ))}
      </div>

      {/* Sorted Mastermind dots — fixed-width cells for column alignment */}
      <div className="flex items-center shrink-0">
        {sortedFeedback.map((f, i) => (
          <span
            key={i}
            style={{
              fontSize: '17px',
              lineHeight: 1,
              width: '19px',
              textAlign: 'center',
              display: 'inline-block',
              color: f === 'correct' ? 'var(--color-dot-correct)'
                   : f === 'present' ? 'var(--color-dot-present)'
                   : 'var(--color-text-faint)',
              opacity: f !== 'correct' && f !== 'present' ? 0.2 : 1,
            }}
          >
            {f === 'correct' ? '●' : f === 'present' ? '○' : '—'}
          </span>
        ))}
      </div>
    </button>
  )
}

function LiveRow({ slots }) {
  const names = slots.filter(Boolean).map(s => s.name)
  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        borderRadius: '8px',
        borderLeft: '3px solid var(--color-border)',
        padding: '3px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        opacity: 0.45,
      }}
    >
      <span style={{ width: '0.9rem', flexShrink: 0 }} />
      <div className="flex-1 min-w-0 flex items-center" style={{ overflow: 'hidden' }}>
        {names.length === 0 ? (
          <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>·····</span>
        ) : names.map((name, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && (
              <span className="shrink-0" style={{ fontSize: '13px', color: 'var(--color-text-faint)', padding: '0 1px' }}> · </span>
            )}
            <span
              className="min-w-0"
              style={{
                fontSize: '13px',
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                flexShrink: 1,
                WebkitMaskImage: 'linear-gradient(to right, black 38px, transparent 62px)',
                maskImage: 'linear-gradient(to right, black 38px, transparent 62px)',
              }}
            >
              {name}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-center shrink-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ fontSize: '13px', lineHeight: 1, width: '16px', textAlign: 'center', display: 'inline-block', color: 'var(--color-text-faint)', opacity: 0.3 }}>·</span>
        ))}
      </div>
    </div>
  )
}
