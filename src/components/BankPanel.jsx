import { useState, useRef, useEffect } from 'react'
import ConfirmMatch from './ConfirmMatch.jsx'

const FREE_MISSES = 3

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
  bankTotal,
  rankSlots,
  bankMisses,
  pendingMatch,
  gameOver,
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
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showBankMsg, setShowBankMsg] = useState(false)
  const [rowFlashKey, setRowFlashKey] = useState(0)
  const feedbackTimer = useRef(null)
  const haikuTimerRef = useRef(null)
  const bankMsgTimer = useRef(null)
  const inputRef = useRef(null)
  const bankScrollRef = useRef(null)

  const burningCoins = bankMisses >= FREE_MISSES
  const bankFull = discoveredList.filter(Boolean).length >= bankTotal

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

  useEffect(() => {
    function updateLeftFade() {
      const node = bankScrollRef.current
      if (!node) return
      setShowLeftFade(node.scrollLeft > 0)
    }

    updateLeftFade()
    window.addEventListener('resize', updateLeftFade)
    return () => window.removeEventListener('resize', updateLeftFade)
  }, [discoveredList.filter(Boolean).length])

  function handleSubmit(e) {
    e.preventDefault()
    if (gameOver) return
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
      showFeedback('hit', `✓ Found ${result.item.name}`)
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
    if (result?.outcome === 'hit') showFeedback('hit', `✓ Found ${result.item.name}`)
    else if (result?.outcome === 'known') showFeedback('known', 'Already discovered')
  }

  // Map rank → slot index for placed items (used for toggle-removal)
  const rankToSlotIndex = {}
  rankSlots.forEach((item, i) => { if (item) rankToSlotIndex[item.rank] = i })
  const placedRanks = new Set(Object.keys(rankToSlotIndex).map(Number))

  return (
    <div className="flex flex-col" style={{ position: 'relative', zIndex: 10, background: 'var(--color-bg)' }}>
      {/* Guess input — hidden once bank is fully discovered */}
      {!bankFull && <div className="px-4 pt-2 pb-2 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          {/* Vertical miss pips */}
          {!burningCoins ? (
            <div
              key={rowFlashKey}
              className={`flex flex-col items-center gap-[3px] shrink-0${rowFlashKey > 0 ? ' row-flash' : ''}`}
            >
              {Array.from({ length: FREE_MISSES }).map((_, i) => {
                const consumed = i < bankMisses
                const isAnimating = i === animatingCircleIdx
                return (
                  <span
                    key={i}
                    className={`shrink-0${isAnimating ? ' circle-drain' : ''}`}
                    onAnimationEnd={isAnimating ? () => setAnimatingCircleIdx(null) : undefined}
                    style={{
                      fontSize: '7px',
                      lineHeight: 1,
                      color: consumed && !isAnimating ? 'var(--color-text-faint)' : 'var(--color-text-strong)',
                      display: 'block',
                    }}
                  >
                    {consumed && !isAnimating ? '○' : '●'}
                  </span>
                )
              })}
            </div>
          ) : (
            <div className="shrink-0 relative" style={{ width: '10px' }}>
              {penaltyKey > 0 && (
                <span
                  key={penaltyKey}
                  className="penalty-float absolute text-xs font-bold"
                  style={{ color: 'var(--color-text-strong)', left: 0, top: 0 }}
                >
                  −1
                </span>
              )}
            </div>
          )}

          {/* Input with overlay for idle/feedback state text */}
          <div className="flex-1 relative">
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
                    const remaining = FREE_MISSES - bankMisses
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
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none${feedback ? ' input-feedback' : ''}`}
              style={feedback ? (() => {
                const c = feedback.type === 'hit'
                  ? 'var(--color-dot-correct)'
                  : feedback.type === 'miss'
                    ? 'var(--color-miss)'
                    : 'var(--color-text-faint)'
                return {
                  '--feedback-color': c,
                  background: `color-mix(in srgb, ${c} 8%, var(--color-bg-elevated))`,
                  border: `1px solid color-mix(in srgb, ${c} 45%, transparent)`,
                  boxShadow: `0 0 0 2.5px color-mix(in srgb, ${c} 18%, transparent)`,
                  color: 'var(--color-text)',
                  fontSize: '16px',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
                }
              })() : {
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                fontSize: '16px',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
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
        <div className="px-4 pt-2 pb-1 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <p className="bank-complete text-xs" style={{ color: 'var(--color-dot-correct)' }}>
            ✓ {bankTotal}/{bankTotal} found — all in the bank
          </p>
        </div>
      )}

      {/* Discovered items + ghost pills */}
      <div className="overflow-y-auto px-4 pt-3 pb-2" style={{ maxHeight: '40vh' }}>
        <div className={`bank-scroll-wrap${showLeftFade ? ' bank-scroll-wrap--left-fade' : ''}`}>
          <div
            ref={bankScrollRef}
            className="bank-scroll-area"
            onScroll={e => setShowLeftFade(e.currentTarget.scrollLeft > 0)}
          >
            <div className="bank-scroll-grid">
              {[0, 1].map(rowIdx => {
                // interleave: row 0 gets items at global positions 0,2,4… row 1 gets 1,3,5…
                const totalPerRow = Math.ceil((rowIdx === 0 ? bankTotal : bankTotal) / 2)
                const rowItems = Array.from({ length: Math.ceil(bankTotal / 2) }, (_, col) => {
                  const globalIdx = col * 2 + rowIdx
                  return globalIdx < bankTotal ? (discoveredList[globalIdx] ?? null) : null
                }).filter((_, col) => col * 2 + rowIdx < bankTotal)
                return (
                  <div key={rowIdx} className="flex gap-2">
                    {rowItems.map((item, col) => {
                      const globalIdx = col * 2 + rowIdx
                      if (item) {
                        const placed = placedRanks.has(item.rank)
                        return (
                          <button
                            key={item.rank}
                            onClick={() => placed ? onRemoveSlot(rankToSlotIndex[item.rank]) : onPlaceItem(item)}
                            className="fade-in flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
                            style={{
                              background: placed ? 'var(--color-pill)' : 'var(--color-bg-elevated)',
                              color: placed ? 'var(--color-pill-text)' : 'var(--color-text)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {item.seeded && <span className="text-xs" style={{ color: placed ? 'var(--color-pill-text)' : 'var(--color-text-faint)' }}>★</span>}
                            {item.name}
                            {placed && <span className="text-xs opacity-70">✕</span>}
                          </button>
                        )
                      }
                      return (
                        <div
                          key={`ghost-${globalIdx}`}
                          className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
                          style={{
                            border: '1.5px dashed var(--color-text-faint)',
                            background: 'var(--color-bg-elevated)',
                            color: 'var(--color-bg-elevated)',
                            userSelect: 'none',
                          }}
                        >
                          ———
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
