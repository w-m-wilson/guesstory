import { useState, useEffect, useRef, useCallback } from 'react'
import { DIFFICULTY_CONFIG } from '../config.js'
import { modalScrimBackground } from '../utils/modalScrim.js'
import ConfirmModal from './ConfirmModal.jsx'
import { AVAILABLE_DATES } from '../data/puzzles/available.js'
import { PixelCalendar, PixelArchive, PixelHelp, PixelAppearance, PixelAbout, PixelDifficulty, PixelReset } from './PixelMenuIcons.jsx'
import ChamferedSurface from './primitives/ChamferedSurface.jsx'

function MissTracker({ misses, difficulty = 'medium' }) {
  const cfg = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.medium
  const free = cfg.category.freeMisses
  const cost = cfg.category.missCost
  const burningCoins = misses >= free
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-col items-center gap-[3px]">
        {Array.from({ length: free }).map((_, i) => {
          const consumed = i < misses
          return (
            <span
              key={i}
              style={{
                display: 'block',
                width: '7px',
                height: '7px',
                background: consumed
                  ? 'linear-gradient(to bottom, color-mix(in srgb, var(--color-text) 14%, var(--color-bg)) 0%, color-mix(in srgb, var(--color-text) 9%, var(--color-bg)) 50%, color-mix(in srgb, var(--color-text) 12%, var(--color-bg)) 100%)'
                  : 'var(--color-text-strong)',
                border: `1px solid ${consumed ? 'color-mix(in srgb, var(--color-text) 22%, var(--color-bg))' : 'var(--color-text-strong)'}`,
                boxShadow: consumed ? 'inset 0 1px 2px rgba(0,0,0,0.18)' : 'none',
              }}
            />
          )
        })}
      </div>
      {burningCoins && (
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

export default function Header({ categoryText, categoryAutoReveal, categoryHint, categoryMisses, difficulty = 'medium', isArchive, onGuessCategory, onOpenIntro, onOpenSettings, onOpenAbout, onOpenArchive, onJumpToToday, onOpenDifficultyPicker, onReset }) {
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
        style={{ overflow: 'visible' }}
      >
        <div className="flex items-center px-4 py-4">
          {/* Left: wordmark */}
          <span
            className="text-3xl tracking-tight shrink-0"
            style={{
              fontFamily: "'Grenze Gotisch', serif",
              color: 'var(--color-action)',
              transform: 'translateY(-4px)',
              textShadow: '-1px -1px 0 rgba(255,255,255,0.08), 1px 1px 0 rgba(0,0,0,0.38), 2px 2px 0 rgba(0,0,0,0.2)',
            }}
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
                className="bit-btn px-4 py-1 text-center"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', minWidth: '150px', maxWidth: '220px' }}
              >
                <p className="text-sm leading-snug" style={{ color: 'var(--color-text-faint)' }}>
                  {arText}{arCursor ? '|' : ''}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setGuessing(true)}
                className="bit-btn px-4 py-1.5 text-sm text-center"
                style={{
                  color: 'var(--color-action-text)',
                  background: 'linear-gradient(to bottom, color-mix(in srgb, black 28%, var(--color-action)) 0%, color-mix(in srgb, black 18%, var(--color-action)) 50%, color-mix(in srgb, black 28%, var(--color-action)) 100%)',
                  border: '1px solid color-mix(in srgb, black 40%, var(--color-action))',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.28)',
                  whiteSpace: 'nowrap',
                  minWidth: '150px',
                  maxWidth: '220px',
                  fontWeight: 600,
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
            <ChamferedSurface
              shadow="popover"
              className="absolute right-0 top-full mt-2 z-50"
              style={{
                minWidth: '160px',
                transformOrigin: 'top right',
                transition: menuOpen
                  ? 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0ms'
                  : 'opacity 140ms cubic-bezier(0.4, 0, 1, 1), transform 140ms cubic-bezier(0.4, 0, 1, 1), visibility 140ms',
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(-8px)',
                visibility: menuOpen ? 'visible' : 'hidden',
                pointerEvents: menuOpen ? 'auto' : 'none',
              }}
            >
                {isArchive && onJumpToToday && (
                  <button
                    onClick={() => { closeMenu(); onJumpToToday() }}
                    className="w-full flex items-center px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-dot-correct)', borderBottom: '1px solid var(--color-border)', gap: '10px' }}
                  >
                    <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PixelCalendar size={16} /></span>
                    <span className="font-bold">Today's Puzzle</span>
                  </button>
                )}
                {onOpenArchive && (
                  <button
                    onClick={() => { closeMenu(); onOpenArchive() }}
                    className="w-full flex items-center px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', gap: '10px' }}
                  >
                    <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PixelArchive size={16} /></span>
                    <span>The Archives</span>
                  </button>
                )}
                {onOpenIntro && (
                  <button
                    onClick={() => { closeMenu(); onOpenIntro() }}
                    className="w-full flex items-center px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', gap: '10px' }}
                  >
                    <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PixelHelp size={16} /></span>
                    <span>How to play</span>
                  </button>
                )}
                {onOpenSettings && (
                  <button
                    onClick={() => { closeMenu(); onOpenSettings() }}
                    className="w-full flex items-center px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', gap: '10px' }}
                  >
                    <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PixelAppearance size={16} /></span>
                    <span>Appearance</span>
                  </button>
                )}
                {onOpenAbout && (
                  <button
                    onClick={() => { closeMenu(); onOpenAbout() }}
                    className="w-full flex items-center px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', gap: '10px' }}
                  >
                    <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PixelAbout size={16} /></span>
                    <span>About & Privacy</span>
                  </button>
                )}
                {onOpenDifficultyPicker && (
                  <button
                    onClick={() => { closeMenu(); onOpenDifficultyPicker() }}
                    className="w-full flex items-center px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', gap: '10px' }}
                  >
                    <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PixelDifficulty size={16} /></span>
                    <span>Difficulty</span>
                  </button>
                )}
                {onReset && (
                  <button
                    onClick={() => { closeMenu(); onReset() }}
                    className="w-full flex items-center px-4 py-3 text-sm text-left"
                    style={{ color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', gap: '10px' }}
                  >
                    <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PixelReset size={16} /></span>
                    <span>Reset game</span>
                  </button>
                )}
            </ChamferedSurface>
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
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: modalScrimBackground({ variant: 'sheet' }), pointerEvents: 'none', ...(sheetClosing ? { opacity: 0, transition: 'opacity 0.2s cubic-bezier(0.4, 0, 1, 1)' } : { animation: 'scrimIn 0.22s ease' }) }} />
          <div
            className={`shadow-dialog ${sheetClosing ? 'slide-down-exit' : 'slide-down'}`}
            style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '430px' }}
            onClick={e => e.stopPropagation()}
          >
          <div
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)',
              paddingBottom: '2.5rem',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              background: 'var(--color-bg)',
              clipPath: 'var(--chamfer-8-bottom)',
            }}
          >
            {/* Sheet header */}
            <div className="flex items-start justify-between" style={{ marginBottom: '1.25rem' }}>
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

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-center" style={{ marginBottom: lastHint ? '1.25rem' : 0 }}>
              <MissTracker misses={categoryMisses} difficulty={difficulty} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="The theme is…"
                className="flex-1 bit-input px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'linear-gradient(to bottom, color-mix(in srgb, var(--color-text) 14%, var(--color-bg)) 0%, color-mix(in srgb, var(--color-text) 9%, var(--color-bg)) 50%, color-mix(in srgb, var(--color-text) 12%, var(--color-bg)) 100%)',
                  color: 'var(--color-text)',
                  border: 'none',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
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
                className="px-4 py-2.5 bit-btn text-sm font-semibold shrink-0 disabled:opacity-40"
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
        </div>
      )}
    </>
  )
}
