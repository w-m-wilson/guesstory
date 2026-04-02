import { useState, useEffect, useRef } from 'react'
import { GAME_CONFIG } from '../config.js'

// Fade only the LEFT edge — right side stays sharp so text end is always readable
const LEFT_FADE = 'linear-gradient(to right, transparent 0%, black 20%, black 100%)'

function MissTracker({ misses }) {
  const free = GAME_CONFIG.category.freeMisses
  const cost = GAME_CONFIG.category.missCost
  const burningCoins = misses >= free
  return (
    <div className="flex items-center gap-1">
      {!burningCoins ? (
        Array.from({ length: free }).map((_, i) => (
          <span
            key={i}
            className="text-xs"
            style={{ color: i < misses ? 'var(--color-text-faint)' : 'var(--color-text-strong)' }}
          >
            {i < misses ? '○' : '●'}
          </span>
        ))
      ) : (
        <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          −{cost} coins/miss
        </span>
      )}
    </div>
  )
}

export default function Header({ categoryText, categoryHint, categoryMisses, onGuessCategory, onOpenIntro, onOpenSettings }) {
  const [guessing, setGuessing] = useState(false)
  const [query, setQuery] = useState('')
  const [lastHint, setLastHint] = useState(null)  // { text, warm } | null
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  // Close input when category is revealed (by hint or correct guess)
  useEffect(() => {
    if (categoryText) {
      setGuessing(false)
      setQuery('')
      setLastHint(null)
    }
  }, [categoryText])

  // Auto-focus input when guess mode opens
  useEffect(() => {
    if (guessing) inputRef.current?.focus()
  }, [guessing])

  async function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    const result = await onGuessCategory(q)
    setLoading(false)
    setQuery('')
    if (result.outcome === 'miss') {
      if (result.warm) {
        setLastHint({ text: result.hint ?? categoryHint ?? 'Getting warmer…', warm: true })
      } else if (result.cold) {
        setLastHint({ text: result.hint ?? 'Not quite', warm: false })
      } else {
        setLastHint(null)
      }
    }
    // 'hit' will trigger the categoryText prop to populate → useEffect closes the input
  }

  return (
    <header
      className="shrink-0"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      {/* Row 1: Rankie wordmark + category text OR guess button */}
      <div className="flex items-center px-4 py-3">
        <span
          className="font-black italic text-xl tracking-tight shrink-0"
          style={{ color: 'var(--color-text-strong)' }}
        >
          Rankie
        </span>

        <button
          onClick={onOpenIntro}
          className="ml-2 shrink-0 text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-50 hover:opacity-100"
          style={{
            border: '1px solid var(--color-text-faint)',
            color: 'var(--color-text-faint)',
          }}
          aria-label="How to play"
        >
          ?
        </button>
        <button
          onClick={onOpenSettings}
          className="ml-1.5 shrink-0 text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-50 hover:opacity-100"
          style={{ color: 'var(--color-text-faint)' }}
          aria-label="Settings"
        >
          ⚙
        </button>

        {categoryText ? (
          /* Revealed: show category, wrapping allowed for long names */
          <div
            key={categoryText}
            className="flex-1 ml-4 fade-in"
          >
            <p
              className="text-xs text-right leading-snug"
              style={{ color: 'var(--color-text-faint)', textWrap: 'balance' }}
            >
              {categoryText}
            </p>
          </div>
        ) : (
          /* Not revealed: show guess button + persistent miss tracker */
          <div className="flex-1 flex flex-col items-end ml-4">
            {!guessing && (
              <button
                onClick={() => setGuessing(true)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Guess category
              </button>
            )}
            {!guessing && categoryMisses > 0 && (
              <MissTracker misses={categoryMisses} />
            )}
          </div>
        )}
      </div>

      {/* Row 2: guess input (only when actively guessing + not yet revealed) */}
      {guessing && !categoryText && (
        <div className="px-4 pb-3 slide-down">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="What's the theme?"
              className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                fontSize: '16px',
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 disabled:opacity-40"
              style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
            >
              {loading ? '…' : '→'}
            </button>
            <button
              type="button"
              onClick={() => setGuessing(false)}
              className="px-2 py-1.5 text-sm"
              style={{ color: 'var(--color-text-faint)' }}
            >
              ✕
            </button>
          </form>

          <div className="flex items-start justify-between mt-1.5 gap-3">
            {categoryMisses > 0
              ? <MissTracker misses={categoryMisses} />
              : <span />}
            {lastHint && (
              <p key={lastHint.text} className="text-xs fade-in text-right" style={{ color: 'var(--color-text-faint)' }}>
                {lastHint.text}
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
