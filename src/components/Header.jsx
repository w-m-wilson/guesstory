import { useState, useEffect, useRef, useCallback } from 'react'
import { DIFFICULTY_CONFIG } from '../config.js'
import { modalScrimBackground } from '../utils/modalScrim.js'

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

const TW_PHRASES = [
  'Tap to guess the category',
  'Tap to guess the theme',
  'Tap to name the connection',
  'Tap to name the theme',
  'Think you know? Tap here',
  'Tap to guess the pattern',
]
const TYPE_MS   = 55
const RETYPE_MS = 75
const ERASE_MS  = 40
const PAUSE_MS  = 500
const CYCLE_MS  = 25000

function pickNextPhrase(current) {
  const pool = TW_PHRASES.filter(s => s !== current)
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function Header({ categoryText, categoryAutoReveal, categoryHint, categoryMisses, difficulty = 'medium', onGuessCategory, onOpenIntro, onOpenSettings, onOpenAbout, onOpenDifficultyPicker, onReset }) {
  const [guessing, setGuessing] = useState(false)
  const [sheetClosing, setSheetClosing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  function closeSheet() {
    if (sheetClosing) return
    setSheetClosing(true)
    setTimeout(() => { setGuessing(false); setSheetClosing(false) }, 180)
  }
  const menuRef = useRef(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu()
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [menuOpen, closeMenu])
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

  // Typewriter: spell out on mount, then erase+retype a random phrase every CYCLE_MS
  useEffect(() => {
    if (categoryText || categoryAutoReveal) return

    const phraseRef = { current: TW_PHRASES[0] }

    function typeFrom(phrase, idx, ms, onDone) {
      setTwCursor(true)
      setTwText(phrase.slice(0, idx))
      if (idx >= phrase.length) { setTwCursor(false); onDone(); return }
      timerRef.current = setTimeout(() => typeFrom(phrase, idx + 1, ms, onDone), ms)
    }

    function eraseTo(phrase, len, onDone) {
      setTwCursor(true)
      setTwText(phrase.slice(0, len))
      if (len <= 0) { onDone(); return }
      timerRef.current = setTimeout(() => eraseTo(phrase, len - 1, onDone), ERASE_MS)
    }

    function cycle(prev) {
      timerRef.current = setTimeout(() => {
        const next = pickNextPhrase(phraseRef.current)
        phraseRef.current = next
        eraseTo(prev, prev.length, () => {
          timerRef.current = setTimeout(() => typeFrom(next, 0, RETYPE_MS, () => cycle(next)), PAUSE_MS)
        })
      }, CYCLE_MS)
    }

    const initial = phraseRef.current
    typeFrom(initial, 0, TYPE_MS, () => cycle(initial))
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
    <>
      <header
        className="shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center px-4 py-4">
          {/* Left: wordmark */}
          <span
            className="text-3xl tracking-tight shrink-0"
            style={{ fontFamily: "'Grenze Gotisch', serif", color: 'var(--color-action)', transform: 'translateY(-4px)' }}
          >
            guesStory
          </span>

          {/* Center: pill — centered within the gap between logo and buttons */}
          <div className="flex-1 flex justify-center px-3">
            {categoryText || arDone ? (
              <p
                key={categoryText || categoryAutoReveal}
                className="fade-in text-sm text-right"
                style={{ color: 'var(--color-text-faint)', fontStyle: 'italic', textWrap: 'balance', lineHeight: 1.2 }}
              >
                {categoryText || categoryAutoReveal}
              </p>
            ) : categoryAutoReveal ? (
              <div
                className="rounded-full px-4 py-1 text-center"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', minWidth: '150px', maxWidth: '220px' }}
              >
                <p className="text-sm leading-snug" style={{ color: 'var(--color-text-faint)' }}>
                  {arText}{arCursor ? '|' : ''}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setGuessing(true)}
                className="rounded-full px-4 py-1 text-sm text-center"
                style={{
                  color: 'var(--color-action)',
                  border: '1px solid var(--color-text-faint)',
                  background: 'transparent',
                  whiteSpace: 'nowrap',
                  minWidth: '150px',
                  maxWidth: '220px',
                  fontWeight: 500,
                }}
              >
                {twText}{twCursor ? '|' : ''}
              </button>
            )}
          </div>

          {/* Right: menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="shrink-0 flex flex-col items-center justify-center gap-[4px] w-6 h-6 opacity-75 hover:opacity-100"
              aria-label="Menu"
            >
              {[0,1,2].map(i => (
                <span key={i} style={{ display: 'block', width: '14px', height: '2px', borderRadius: '1px', background: 'var(--color-text)' }} />
              ))}
            </button>
            <div
              className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                minWidth: '160px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                transformOrigin: 'top right',
                transition: 'opacity 140ms ease, transform 140ms ease',
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(-6px)',
                pointerEvents: menuOpen ? 'auto' : 'none',
              }}
            >
                {onOpenIntro && (
                  <button
                    onClick={() => { closeMenu(); onOpenIntro() }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <span style={{ opacity: 0.6 }}>?</span> How to play
                  </button>
                )}
                {onOpenSettings && (
                  <button
                    onClick={() => { closeMenu(); onOpenSettings() }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)' }}
                  >
                    <span style={{ opacity: 0.6 }}>◑</span> Appearance
                  </button>
                )}
                {onOpenAbout && (
                  <button
                    onClick={() => { closeMenu(); onOpenAbout() }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)' }}
                  >
                    <span style={{ opacity: 0.6 }}>ℹ</span> About & Privacy
                  </button>
                )}
                {onOpenDifficultyPicker && (
                  <button
                    onClick={() => { closeMenu(); onOpenDifficultyPicker() }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)' }}
                  >
                    <span style={{ opacity: 0.6 }}>⬓</span> Difficulty
                  </button>
                )}
                {onReset && (
                  <button
                    onClick={() => { closeMenu(); onReset() }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)' }}
                  >
                    <span style={{ opacity: 0.6 }}>↺</span> Reset game
                  </button>
                )}
            </div>
          </div>
        </div>
      </header>

      {/* Category guess modal — top sheet */}
      {guessing && !categoryText && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center"
          style={{ touchAction: 'none' }}
          onClick={closeSheet}
        >
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: modalScrimBackground({ variant: 'sheet' }), pointerEvents: 'none', ...(sheetClosing ? { opacity: 0, transition: 'opacity 0.18s ease' } : { animation: 'scrimIn 0.2s ease' }) }} />
          <div
            className={`w-full max-w-[430px] flex flex-col gap-5 px-5 pb-7${sheetClosing ? '' : ' slide-down'}`}
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
              background: 'var(--color-bg)',
              borderBottom: '1px solid var(--color-border)',
              borderRadius: '0 0 1.5rem 1.5rem',
              position: 'relative',
              zIndex: 1,
              ...(sheetClosing ? { opacity: 0, transform: 'translateY(-12px)', transition: 'opacity 0.18s ease, transform 0.18s ease' } : {}),
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold" style={{ color: 'var(--color-text-strong)' }}>
                  Guess the category
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                  What's the ranking theme? Earn a bonus for getting it right.
                </p>
              </div>
              <button
                onClick={closeSheet}
                className="text-lg leading-none ml-4 mt-0.5 opacity-40 hover:opacity-70"
                style={{ color: 'var(--color-text-faint)' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Miss tracker */}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                {categoryMisses === 0 ? 'Free guesses:' : 'Misses:'}
              </span>
              <MissTracker misses={categoryMisses} difficulty={difficulty} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="The theme is…"
                className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '16px',
                }}
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck={true}
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0 disabled:opacity-40"
                style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
              >
                {loading ? '…' : 'Guess'}
              </button>
            </form>

            {/* Hint feedback */}
            {lastHint && (
              <p
                key={lastHint.text}
                className="text-sm fade-in text-center"
                style={{ color: lastHint.warm ? 'var(--color-dot-present)' : 'var(--color-text-faint)' }}
              >
                {lastHint.text}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
