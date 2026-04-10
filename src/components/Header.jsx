import { useState, useEffect, useRef } from 'react'
import { DIFFICULTY_CONFIG } from '../config.js'


function MissTracker({ misses, difficulty = 'medium' }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.medium
  const free = cfg.category.freeMisses
  const cost = cfg.category.missCost
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

const TYPEWRITER_FULL   = 'Guess the category'
const TYPEWRITER_PREFIX = 'Guess '.length
const TYPE_MS   = 68
const RETYPE_MS = 110
const ERASE_MS  = 90
const PAUSE_MS  = 500
const CYCLE_MS = 60000

export default function Header({ categoryText, categoryAutoReveal, categoryHint, categoryMisses, difficulty = 'medium', onGuessCategory, onOpenIntro, onOpenSettings }) {
  const [guessing, setGuessing] = useState(false)
  const [query, setQuery] = useState('')
  const [lastHint, setLastHint] = useState(null)  // { text, warm } | null
  const [loading, setLoading] = useState(false)
  const [twText, setTwText] = useState('')
  const [twCursor, setTwCursor] = useState(true)
  const [arText, setArText] = useState('')      // auto-reveal typewriter text
  const [arCursor, setArCursor] = useState(true)
  const [arDone, setArDone] = useState(false)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-reveal typewriter: type out the category name on mount (today-only mode)
  useEffect(() => {
    if (!categoryAutoReveal || categoryText) return

    function typeFrom(idx) {
      setArCursor(true)
      setArText(categoryAutoReveal.slice(0, idx))
      if (idx >= categoryAutoReveal.length) {
        setArCursor(false)
        setArDone(true)
        return
      }
      timerRef.current = setTimeout(() => typeFrom(idx + 1), TYPE_MS)
    }

    timerRef.current = setTimeout(() => typeFrom(0), PAUSE_MS)
    return () => clearTimeout(timerRef.current)
  }, [categoryAutoReveal, categoryText])

  // Typewriter: spell out on mount, then erase+retype "category" every ~60s
  useEffect(() => {
    if (categoryText || categoryAutoReveal) return

    function typeFrom(idx, ms, onDone) {
      setTwCursor(true)
      setTwText(TYPEWRITER_FULL.slice(0, idx))
      if (idx >= TYPEWRITER_FULL.length) { setTwCursor(false); onDone(); return }
      timerRef.current = setTimeout(() => typeFrom(idx + 1, ms, onDone), ms)
    }

    function eraseTo(len, onDone) {
      setTwCursor(true)
      setTwText(TYPEWRITER_FULL.slice(0, len))
      if (len <= TYPEWRITER_PREFIX) { onDone(); return }
      timerRef.current = setTimeout(() => eraseTo(len - 1, onDone), ERASE_MS)
    }

    function cycle() {
      timerRef.current = setTimeout(() => {
        eraseTo(TYPEWRITER_FULL.length, () => {
          timerRef.current = setTimeout(() => typeFrom(TYPEWRITER_PREFIX, RETYPE_MS, cycle), PAUSE_MS)
        })
      }, CYCLE_MS)
    }

    typeFrom(0, TYPE_MS, cycle)
    return () => clearTimeout(timerRef.current)
  }, [categoryText, categoryAutoReveal])

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
      {/* Row 1: Reckon wordmark + category text OR guess button */}
      <div className="flex items-center px-4 py-3">
        <span
          className="text-xl tracking-tight shrink-0"
          style={{ fontFamily: "'Rye', serif", color: 'var(--color-text-strong)' }}
        >
          Reckon
        </span>

        {onOpenIntro && (
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
        )}
        <button
          onClick={onOpenSettings}
          className="ml-1.5 shrink-0 text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-50 hover:opacity-100"
          style={{ color: 'var(--color-text-faint)' }}
          aria-label="Settings"
        >
          ⚙
        </button>

        {categoryText || arDone ? (
          /* Revealed: show category, wrapping allowed for long names */
          <div
            key={categoryText || categoryAutoReveal}
            className="flex-1 ml-4 fade-in"
          >
            <p
              className="text-xs text-right leading-snug"
              style={{ color: 'var(--color-text-faint)', textWrap: 'balance', fontFamily: "'Courier New', Courier, monospace", fontWeight: 700 }}
            >
              {categoryText || categoryAutoReveal}
            </p>
          </div>
        ) : categoryAutoReveal ? (
          /* Auto-reveal: typewriter animates the actual category text */
          <div className="flex-1 ml-4">
            <p
              className="text-xs text-right leading-snug"
              style={{ color: 'var(--color-text-faint)', fontFamily: "'Courier New', Courier, monospace", fontWeight: 700 }}
            >
              {arText}{arCursor ? '|' : ''}
            </p>
          </div>
        ) : (
          /* Not revealed: show guess button + persistent miss tracker */
          <div className="flex-1 flex flex-col items-end ml-4">
            {!guessing && (
              <button
                onClick={() => setGuessing(true)}
                className="text-xs px-2 py-1 rounded-lg"
              >
                <span style={{ color: 'var(--color-text)', fontFamily: "'Courier New', Courier, monospace", fontWeight: 700 }}>
                  {twText}{twCursor ? '|' : ''}</span>
              </button>
            )}
            {!guessing && categoryMisses > 0 && (
              <MissTracker misses={categoryMisses} difficulty={difficulty} />
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
              ? <MissTracker misses={categoryMisses} difficulty={difficulty} />
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
