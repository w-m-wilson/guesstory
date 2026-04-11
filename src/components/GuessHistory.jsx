import { useEffect, useLayoutEffect, useRef, useState } from 'react'

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

  const nameRef = useRef(null)
  const [compact, setCompact] = useState(false)

  useLayoutEffect(() => {
    const el = nameRef.current
    if (!el) return
    setCompact(el.scrollWidth > el.clientWidth)
  }, [slots])

  const names = slots.map(s => s?.name ?? '—')
  const displayText = compact
    ? names.map(n => n.length > 5 ? n.slice(0, 5) : n).join(' · ')
    : names.join(' · ')

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

      {/* Names — flex-1, fades to right, compacts only if it actually overflows */}
      <span
        ref={nameRef}
        className="flex-1 min-w-0"
        style={{
          fontSize: '13px',
          color: 'var(--color-text)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(to right, black 75%, transparent 100%)',
          maskImage: 'linear-gradient(to right, black 75%, transparent 100%)',
        }}
      >
        {displayText}
      </span>

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
  const nameRef = useRef(null)
  const [compact, setCompact] = useState(false)

  useLayoutEffect(() => {
    const el = nameRef.current
    if (!el) return
    setCompact(el.scrollWidth > el.clientWidth)
  }, [slots])

  const rawNames = slots.filter(Boolean).map(s => s.name)
  const names = compact
    ? rawNames.map(n => n.length > 5 ? n.slice(0, 5) : n).join(' · ')
    : rawNames.join(' · ')
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
      <span
        ref={nameRef}
        className="flex-1 min-w-0"
        style={{
          fontSize: '13px',
          color: 'var(--color-text)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(to right, black 75%, transparent 100%)',
          maskImage: 'linear-gradient(to right, black 75%, transparent 100%)',
        }}
      >
        {names || '·····'}
      </span>
      <div className="flex items-center shrink-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ fontSize: '13px', lineHeight: 1, width: '16px', textAlign: 'center', display: 'inline-block', color: 'var(--color-text-faint)', opacity: 0.3 }}>·</span>
        ))}
      </div>
    </div>
  )
}
