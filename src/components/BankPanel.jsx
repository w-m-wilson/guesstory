import { useState, useRef, useEffect, useMemo } from 'react'
import ConfirmMatch from './ConfirmMatch.jsx'
import RaisedPill from './primitives/RaisedPill.jsx'
import PressedPill from './primitives/PressedPill.jsx'
import EmptySlot from './primitives/EmptySlot.jsx'
// Heuristic: does this guess look like a category answer typed in the wrong field?
// Category format is "[things] ranked by [metric]" — key signals are ranking/metric words.
function looksLikeCategory(guess) {
  const s = guess.toLowerCase().trim()
  return (
    /\bby\b/.test(s) ||
    /\b(ranked|sorted|ordered|ranking)\b/.test(s) ||
    /\b(most|highest|lowest|biggest|largest|smallest|fewest)\b/.test(s) ||
    /\b(total|gross|revenue|earnings|sales|income|budget|worldwide|domestic|per capita|population|number of)\b/.test(s)
  )
}

export default function BankPanel({
  discoveredList,
  ghostLetters,
  bankTotal,
  rankSlots,
  bankMisses,
  freeMisses,
  pendingMatch,
  gameOver,
  tutorialStep,
  onGuess,
  onConfirm,
  onCancel,
  onPlaceItem,
  onRemoveSlot,
}) {
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState(null) // { type, message, ts }
  const [haikuHint, setHaikuHint] = useState(null)
  const [animatingCircleIdx, setAnimatingCircleIdx] = useState(null)
  const [penaltyKey, setPenaltyKey] = useState(0)
  const [showBankMsg, setShowBankMsg] = useState(false)
  const [rowFlashKey, setRowFlashKey] = useState(0)
  const [hasGuessed, setHasGuessed] = useState(false)
  const feedbackTimer = useRef(null)
  const haikuTimerRef = useRef(null)
  const bankMsgTimer = useRef(null)
  const inputRef = useRef(null)

  const burningCoins = bankMisses >= freeMisses
  const discoveredCount = discoveredList.filter(Boolean).length
  const bankFull = discoveredCount >= bankTotal

  function showFeedback(type, message) {
    clearTimeout(feedbackTimer.current)
    setFeedback({ type, message, ts: Date.now() })
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1200)
  }

  useEffect(() => () => {
    clearTimeout(feedbackTimer.current)
    clearTimeout(haikuTimerRef.current)
    clearTimeout(bankMsgTimer.current)
  }, [])

  useEffect(() => {
    if (bankFull) {
      setShowBankMsg(true)
      bankMsgTimer.current = setTimeout(() => setShowBankMsg(false), 2500)
    }
  }, [bankFull])

  function handleSubmit(e) {
    e.preventDefault()
    if (gameOver) return
    setHasGuessed(true)
    const q = query.trim()
    if (!q) return

    // Intercept before scoring: if it looks like a category guess, redirect without penalising
    if (looksLikeCategory(q)) {
      setQuery('')
      clearTimeout(haikuTimerRef.current)
      setHaikuHint('That looks like a category answer — try guessing it in the field at the top.')
      haikuTimerRef.current = setTimeout(() => setHaikuHint(null), 6000)
      return
    }

    const result = onGuess(q)
    setQuery('')
    setHaikuHint(null)
    clearTimeout(haikuTimerRef.current)
    if (!result) return

    if (result.outcome === 'hit') {
      showFeedback('hit', `✓ Found ${result.item.display ?? result.item.name}`)
    } else if (result.outcome === 'known') {
      showFeedback('known', `Already discovered`)
    } else if (result.outcome === 'miss') {
      setRowFlashKey(k => k + 1)
      showFeedback('miss', `${q} — not in bank`)
      if (!burningCoins) {
        setAnimatingCircleIdx(bankMisses)
      } else {
        setPenaltyKey(k => k + 1)
      }
    }
    // 'pending' is handled by ConfirmMatch appearing
  }

  function handleConfirm() {
    const result = onConfirm()
    if (result?.outcome === 'hit') showFeedback('hit', `✓ Found ${result.item.display ?? result.item.name}`)
    else if (result?.outcome === 'known') showFeedback('known', 'Already discovered')
  }

  // Map rank → slot index for placed items (used for toggle-removal)
  const { rankToSlotIndex, placedRanks } = useMemo(() => {
    const rankToSlotIndex = {}
    rankSlots.forEach((item, i) => { if (item) rankToSlotIndex[item.rank] = i })
    return { rankToSlotIndex, placedRanks: new Set(Object.keys(rankToSlotIndex).map(Number)) }
  }, [rankSlots])

  return (
    <div className="flex flex-col" style={{ position: 'relative', zIndex: 10, background: 'var(--color-bg)' }}>
      {/* Guess input — hidden once bank is fully discovered */}
      {!bankFull && <div className="px-4 pt-2 pb-2 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          {/* Vertical miss pips */}
          <div className="shrink-0 relative flex flex-col items-center gap-[3px]">
            {penaltyKey > 0 && (
              <span
                key={penaltyKey}
                className="penalty-float absolute text-xs font-bold"
                style={{ color: 'var(--color-text-strong)', left: '50%', top: 0, transform: 'translateX(-50%)' }}
              >
                −1
              </span>
            )}
            <div
              key={rowFlashKey}
              className={`flex flex-col items-center gap-[3px] shrink-0${rowFlashKey > 0 ? ' row-flash' : ''}`}
            >
              {Array.from({ length: freeMisses }).map((_, i) => {
                const consumed = i < bankMisses
                const isAnimating = i === animatingCircleIdx
                return (
                  <span
                    key={i}
                    className={`shrink-0${isAnimating ? ' circle-drain' : ''}`}
                    onAnimationEnd={isAnimating ? () => setAnimatingCircleIdx(null) : undefined}
                    style={{
                      display: 'block',
                      width: '7px',
                      height: '7px',
                      background: consumed && !isAnimating
                        ? 'var(--elev-empty-bg)'
                        : 'var(--color-text-strong)',
                      border: `1px solid ${consumed && !isAnimating ? 'color-mix(in srgb, var(--color-text) 22%, var(--color-bg))' : 'var(--color-text-strong)'}`,
                      boxShadow: consumed && !isAnimating ? 'var(--inset-empty)' : 'none',
                      opacity: 1,
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Input with overlay for idle/feedback state text */}
          <div className={`flex-1 relative${tutorialStep === 1 && !hasGuessed ? ' tutorial-pulse' : ''}`}>
            {query === '' && (
              <span
                className="absolute inset-0 flex items-center px-3 pointer-events-none text-sm select-none"
                style={{
                  color: feedback
                    ? (feedback.type === 'hit' ? 'var(--color-dot-correct)' : feedback.type === 'miss' ? 'var(--color-miss)' : 'var(--color-text-faint)')
                    : 'var(--color-text-faint)',
                  fontStyle: haikuHint && !feedback ? 'italic' : 'normal',
                  opacity: feedback ? 1 : 0.7,
                  zIndex: 1,
                }}
              >
                {feedback ? feedback.message
                  : haikuHint ? haikuHint
                  : pendingMatch ? 'Confirm or cancel below…'
                  : burningCoins ? '−1 coin per miss'
                  : bankMisses === 0 ? 'Start guessing…'
                  : (() => {
                    const remaining = freeMisses - bankMisses
                    const words = ['one', 'two', 'three']
                    return `${words[remaining - 1] ?? remaining} free miss${remaining === 1 ? '' : 'es'} remaining`
                  })()
                }
              </span>
            )}
            <button type="submit" style={{ display: 'none' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder=""
              disabled={!!pendingMatch || gameOver}
              className={`w-full bit-input px-3 py-2 text-sm outline-none${feedback ? ' input-feedback' : ''}`}
              style={feedback ? (() => {
                const c = feedback.type === 'hit'
                  ? 'var(--color-dot-correct)'
                  : feedback.type === 'miss'
                    ? 'var(--color-miss)'
                    : 'var(--color-text-faint)'
                return {
                  '--feedback-color': c,
                  background: `color-mix(in srgb, ${c} 6%, var(--color-bg-elevated))`,
                  border: 'none',
                  boxShadow: `inset 0 1px 4px color-mix(in srgb, ${c} 55%, rgba(0,0,0,0.12))`,
                  color: 'var(--color-text)',
                  fontSize: '16px',
                  transition: 'box-shadow 0.2s ease, background 0.2s ease',
                }
              })() : {
                background: 'var(--elev-empty-bg)',
                color: 'var(--color-text)',
                border: 'none',
                boxShadow: 'var(--inset-empty)',
                fontSize: '16px',
                transition: 'box-shadow 0.2s ease, background 0.2s ease',
              }}
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck={true}
            />
          </div>
        </form>

        {/* Confirm match prompt */}
        {pendingMatch && (
          <div className="slide-down">
            <ConfirmMatch
              item={pendingMatch.item}
              onConfirm={handleConfirm}
              onCancel={onCancel}
            />
          </div>
        )}
      </div>}

      {/* Bank complete line */}
      {bankFull && showBankMsg && (
        <div className="px-4 pt-2 pb-1 shrink-0">
          <p className="bank-complete text-xs" style={{ color: 'var(--color-dot-correct)' }}>
            ✓ {bankTotal}/{bankTotal} found — all in the bank
          </p>
        </div>
      )}

      {/* Discovered items + ghost pills */}
      <div className="px-4 pt-2 pb-4 bank-scroll">
        <div className="bank-grid">
          {[0, 1].map(rowIdx => {
            const rowIndices = []
            for (let i = rowIdx; i < bankTotal; i += 2) rowIndices.push(i)
            return (
              <div key={rowIdx} className="bank-row">
                {rowIndices.map(globalIdx => {
                  const item = discoveredList[globalIdx] ?? null
                  if (item) {
                    const placed = placedRanks.has(item.rank)
                    const nudge = tutorialStep === 2 && !placed
                    const onClick = () => placed ? onRemoveSlot(rankToSlotIndex[item.rank]) : onPlaceItem(item)
                    const innerClass = 'fade-in flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap'
                    const contents = (
                      <>
                        {item.seeded && <span className="text-xs" style={{ color: placed ? 'var(--color-pill-text)' : 'var(--color-text-faint)' }}>★</span>}
                        {item.display ?? item.name}
                        {placed && <span className="text-xs opacity-70">✕</span>}
                      </>
                    )
                    if (placed) {
                      return (
                        <PressedPill
                          key={item.rank}
                          chamfer="pill"
                          onClick={onClick}
                          className={innerClass}
                          style={{ color: 'var(--color-pill-text)' }}
                        >
                          {contents}
                        </PressedPill>
                      )
                    }
                    return (
                      <RaisedPill
                        key={item.rank}
                        chamfer="pill"
                        onClick={onClick}
                        className={innerClass}
                        style={{ color: 'var(--color-text)' }}
                        wrapClassName={nudge ? 'pill-trace-wrap' : ''}
                      >
                        {contents}
                      </RaisedPill>
                    )
                  }
                  const ghostLetter = ghostLetters?.[globalIdx]
                  return (
                    <EmptySlot
                      key={`ghost-${globalIdx}`}
                      chamfer="pill"
                      className="px-3 py-1.5 text-sm font-medium whitespace-nowrap"
                      style={{
                        color: ghostLetter ? 'var(--color-text-faint)' : 'transparent',
                        userSelect: 'none',
                      }}
                    >
                      {ghostLetter ?? '———'}
                    </EmptySlot>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
