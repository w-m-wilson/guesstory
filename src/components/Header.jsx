import { useState, useEffect, useRef } from 'react'
import { GAME_CONFIG } from '../config.js'

// Fade only the LEFT edge — right side stays sharp so text end is always readable
const LEFT_FADE = 'linear-gradient(to right, transparent 0%, black 20%, black 100%)'

export default function Header({ categoryText, categoryHint, onGuessCategory, onOpenIntro }) {
  const [guessing, setGuessing] = useState(false)
  const [query, setQuery] = useState('')
  const [missCount, setMissCount] = useState(0)
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
      setMissCount(c => c + 1)
      if (result.warm && (result.hint || categoryHint)) {
        setLastHint({ text: result.hint ?? categoryHint, warm: true })
      } else if (result.cold && result.hint) {
        setLastHint({ text: result.hint, warm: false })
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
          /* Not revealed: show guess button (hidden while input row is open) */
          <div className="flex-1 flex justify-end ml-4">
            {!guessing && (
              <button
                onClick={() => { setGuessing(true); setMissCount(0) }}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Guess category
              </button>
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

          {missCount > 0 && (
            <p className="text-xs mt-1.5 fade-in" style={{ color: 'var(--color-text-faint)' }}>
              {missCount === 1
                ? `Not quite — ${GAME_CONFIG.category.freeMisses} free tries`
                : missCount <= GAME_CONFIG.category.freeMisses
                  ? 'Not quite — keep trying'
                  : `Not quite — −1 coin per miss`}
            </p>
          )}
          {lastHint && (
            <p key={lastHint.text} className="text-xs mt-1 fade-in" style={{ color: 'var(--color-text-faint)' }}>
              {lastHint.text}
            </p>
          )}
        </div>
      )}
    </header>
  )
}
