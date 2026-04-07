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
  category,
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
  const feedbackTimer = useRef(null)
  const haikuTimerRef = useRef(null)
  const inputRef = useRef(null)
  const bankScrollRef = useRef(null)

  function showFeedback(type, message) {
    clearTimeout(feedbackTimer.current)
    setFeedback({ type, message, ts: Date.now() })
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2500)
  }

  useEffect(() => () => {
    clearTimeout(feedbackTimer.current)
    clearTimeout(haikuTimerRef.current)
  }, [])

  useEffect(() => {
    function updateLeftFade() {
      const node = bankScrollRef.current
      if (!node) return
      setShowLeftFade(node.scrollLeft > 0)
    }

    updateLeftFade()
    window.addEventListener('resize', updateLeftFade)
    return () => window.removeEventListener('resize', updateLeftFade)
  }, [discoveredList.length])

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
      if (!burningCoins) {
        setAnimatingCircleIdx(bankMisses)
        const remaining = Math.max(0, FREE_MISSES - bankMisses - 1)
        if (remaining > 0) {
          showFeedback('miss', `Not in the bank — ${remaining} free ${remaining === 1 ? 'miss' : 'misses'} left`)
        } else {
          showFeedback('miss', `Not in the bank — last free miss used`)
        }
      } else {
        setPenaltyKey(k => k + 1)
        showFeedback('miss', `Not in the bank`)
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

  const freeMissesLeft = Math.max(0, FREE_MISSES - bankMisses)
  const burningCoins = bankMisses >= FREE_MISSES
  const bankFull = discoveredList.length >= bankTotal

  return (
    <div className="flex flex-col" style={{ position: 'relative', zIndex: 10, background: 'var(--color-bg)' }}>
      {/* Guess input — hidden once bank is fully discovered */}
      {!bankFull && <div className="px-4 pt-2 pb-2 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--color-text-faint)', opacity: 0.5 }}>
          Find
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={pendingMatch ? 'Confirm or cancel below…' : 'Submit a guess for the bank…'}
            disabled={!!pendingMatch || gameOver}
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontSize: '16px',  /* prevents iOS Safari zoom on focus */
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!!pendingMatch || !query.trim() || gameOver}
            className="px-3 py-2 rounded-lg text-sm font-medium shrink-0 disabled:opacity-40"
            style={{
              background: 'var(--color-text-strong)',
              color: 'var(--color-bg)',
            }}
          >
            Guess
          </button>
        </form>

        {/* Free-miss indicator or coin cost notice */}
        <div className="mt-1.5 flex items-center gap-1.5 h-5" style={{ position: 'relative' }}>
          {!burningCoins ? (
            <>
              <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                Free misses:
              </span>
              {Array.from({ length: FREE_MISSES }).map((_, i) => {
                const consumed = i < bankMisses
                const isAnimating = i === animatingCircleIdx
                return (
                  <span
                    key={i}
                    className={`text-xs${isAnimating ? ' circle-drain' : ''}`}
                    onAnimationEnd={isAnimating ? () => setAnimatingCircleIdx(null) : undefined}
                    style={{
                      color: consumed && !isAnimating ? 'var(--color-text-faint)' : 'var(--color-text-strong)',
                      display: 'inline-block',
                    }}
                  >
                    {consumed && !isAnimating ? '○' : '●'}
                  </span>
                )
              })}
            </>
          ) : (
            <>
              <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                −1 coin per miss
              </span>
              {penaltyKey > 0 && (
                <span
                  key={penaltyKey}
                  className="penalty-float absolute text-xs font-bold"
                  style={{ color: 'var(--color-text-strong)', left: 0, top: '-2px' }}
                >
                  −1
                </span>
              )}
            </>
          )}
          <span className="ml-auto text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {discoveredList.length}/{bankTotal} found
          </span>
        </div>

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

        {/* Inline feedback (hidden when confirm prompt is showing) */}
        {!pendingMatch && feedback && (
          <p
            key={feedback.ts}
            className={`text-xs mt-1 ${feedback.type === 'miss' ? 'shake-fade-in' : 'fade-in'}`}
            style={{
              color: feedback.type === 'hit'
                ? 'var(--color-text-strong)'
                : 'var(--color-text-faint)',
            }}
          >
            {feedback.message}
          </p>
        )}
        {/* Haiku directional hint — appears on 2nd+ miss */}
        {!pendingMatch && haikuHint && (
          <p key={haikuHint} className="fade-in text-xs mt-0.5 italic" style={{ color: 'var(--color-text-faint)' }}>
            {haikuHint}
          </p>
        )}
      </div>}

      {/* Bank complete banner */}
      {bankFull && (
        <div
          className="bank-complete px-4 pt-3 pb-2 shrink-0 text-center text-sm font-medium"
          style={{ color: 'var(--color-text-strong)' }}
        >
          You got them all!
        </div>
      )}

      {/* Discovered items */}
      <div className="overflow-y-auto px-4 pt-3 pb-2" style={{ maxHeight: '40vh' }}>
        {discoveredList.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
            {bankMisses === 0
              ? `Type anything in the puzzle's topic — you have ${FREE_MISSES} free misses.`
              : 'Nothing found yet — keep trying.'}
          </p>
        ) : (
          <div className={`bank-scroll-wrap${showLeftFade ? ' bank-scroll-wrap--left-fade' : ''}`}>
            <div
              ref={bankScrollRef}
              className="bank-scroll-area"
              onScroll={e => setShowLeftFade(e.currentTarget.scrollLeft > 0)}
            >
              <div className="bank-scroll-grid">
                {[discoveredList.filter((_, i) => i % 2 === 0), discoveredList.filter((_, i) => i % 2 === 1)].map((row, rowIdx) =>
                  row.length === 0 ? null : (
                    <div key={rowIdx} className="flex gap-2">
                      {row.map(item => {
                        const placed = placedRanks.has(item.rank)
                        return (
                          <button
                            key={item.rank}
                            onClick={() => {
                              if (placed) onRemoveSlot(rankToSlotIndex[item.rank])
                              else onPlaceItem(item)
                            }}
                            className="fade-in flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
                            style={{
                              background: placed ? 'var(--color-text-strong)' : 'var(--color-bg-elevated)',
                              color: placed ? 'var(--color-bg)' : 'var(--color-text)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {item.seeded && (
                              <span
                                className="text-xs"
                                style={{ color: placed ? 'var(--color-bg)' : 'var(--color-text-faint)' }}
                                title="Given at start"
                              >
                                ★
                              </span>
                            )}
                            {item.name}
                            {placed && <span className="text-xs opacity-70">✕</span>}
                          </button>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
