import { useRef, useState, useEffect, useCallback } from 'react'
import PixelCoin from './PixelCoin.jsx'

const DIFFICULTY_LABELS = { lite: 'LITE', medium: 'MED', challenge: 'CHAL' }
const DIFFICULTY_ORDER = ['lite', 'medium', 'challenge']
const DIFFICULTY_NAMES = { lite: 'Lite', medium: 'Medium', challenge: 'Challenge' }
const DIFFICULTY_BLURBS = { lite: 'Most answers given', medium: 'A few starting hints', challenge: 'No hints — from scratch' }

export default function ScoreBar({ coins, gameOver, difficulty = 'medium', hideDifficulty = false, isArchive, onSetDifficulty, onHintsOpen, onShowResults, onOpenArchive, onRegisterPickerTrigger }) {
  const prevCoins = useRef(coins)
  const [deltas, setDeltas] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)
  const [hintsGlinting, setHintsGlinting] = useState(false)

  useEffect(() => {
    if (gameOver) return
    function schedule() {
      const delay = 8000 + Math.random() * 12000
      return setTimeout(() => {
        setHintsGlinting(true)
        setTimeout(() => setHintsGlinting(false), 1400)
        timerRef.current = schedule()
      }, delay)
    }
    const timerRef = { current: null }
    timerRef.current = schedule()
    return () => clearTimeout(timerRef.current)
  }, [gameOver])

  const closePicker = useCallback(() => setPickerOpen(false), [])
  const openPicker  = useCallback(() => setPickerOpen(true),  [])

  // Register external trigger (called by hamburger menu via GameScreen)
  useEffect(() => {
    onRegisterPickerTrigger?.(openPicker)
  }, [onRegisterPickerTrigger, openPicker])

  // Close on pointerdown outside (same pattern as header menu)
  useEffect(() => {
    if (!pickerOpen) return
    function handleOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) closePicker()
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [pickerOpen, closePicker])

  useEffect(() => {
    const delta = prevCoins.current - coins
    if (delta !== 0) {
      const id = Date.now()
      setDeltas(prev => [...prev, { id, amount: Math.abs(delta), positive: delta < 0 }])
      setTimeout(() => setDeltas(prev => prev.filter(d => d.id !== id)), 1500)
    }
    prevCoins.current = coins
  }, [coins])

  const easierOptions = DIFFICULTY_ORDER.slice(0, DIFFICULTY_ORDER.indexOf(difficulty))
  const canSwitch = !hideDifficulty && easierOptions.length > 0

  return (
    <div style={{ position: 'relative' }}>
      {/* Mid-game difficulty picker — always in DOM, CSS transition like header menu */}
      {!hideDifficulty && (
        <div ref={pickerRef} className="absolute bottom-full left-4 z-[46] pb-2">
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              minWidth: '200px',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.22)',
              transformOrigin: 'bottom left',
              transition: pickerOpen
                ? 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0ms'
                : 'opacity 140ms cubic-bezier(0.4, 0, 1, 1), transform 140ms cubic-bezier(0.4, 0, 1, 1), visibility 140ms',
              opacity: pickerOpen ? 1 : 0,
              transform: pickerOpen ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(8px)',
              visibility: pickerOpen ? 'visible' : 'hidden',
              pointerEvents: pickerOpen ? 'auto' : 'none',
            }}
          >
            <p className="text-[10px] font-black tracking-widest uppercase px-4 pt-3 pb-1" style={{ color: 'var(--color-text-faint)', opacity: 0.5 }}>
              Make it easier
            </p>
            {easierOptions.map((d, i) => (
              <button
                key={d}
                onClick={() => { closePicker(); onSetDifficulty?.(d) }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
                style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-strong)' }}>{DIFFICULTY_NAMES[d]}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>{DIFFICULTY_BLURBS[d]}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="relative flex items-center justify-between px-4 py-3 shrink-0"
      >
        {/* Coin display + difficulty badge */}
        <div className="flex items-center gap-2 relative">
          <PixelCoin size={18} />

          <span
            key={coins}
            className="coin-pulse text-xl font-bold tabular-nums"
            style={{ color: 'var(--color-dot-present)', fontFamily: "'VT323', monospace", fontSize: '1.5rem', lineHeight: 1 }}
          >
            {coins}
          </span>

          {deltas.map(({ id, amount, positive }) => (
            <span
              key={id}
              className="coin-float absolute left-6 text-base font-bold"
              style={{ color: positive ? 'var(--color-dot-present)' : 'var(--color-text-faint)', top: '-6px' }}
            >
              {positive ? `+${amount}` : `−${amount}`}
            </span>
          ))}

          {!hideDifficulty && (
            <button
              onClick={canSwitch ? () => setPickerOpen(p => !p) : undefined}
              className="text-[10px] font-black tracking-widest rounded-md px-2 py-0.5"
              style={{
                color: 'var(--color-text-strong)',
                background: 'var(--color-bg-elevated)',
                border: '1.5px solid var(--color-border)',
                cursor: canSwitch ? 'pointer' : 'default',
              }}
              aria-label={canSwitch ? 'Change difficulty' : `Difficulty: ${DIFFICULTY_NAMES[difficulty]}`}
            >
              {DIFFICULTY_LABELS[difficulty] ?? 'MED'}
            </button>
          )}
        </div>

        {/* Archive / Today's + Results or Hints */}
        <div className="flex items-center gap-2">
          {onOpenArchive && (
            <button
              onClick={onOpenArchive}
              className="flex items-center gap-1 px-3 py-1.5 bit-btn text-sm font-medium"
              style={{
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-faint)',
                border: '1px solid var(--color-border)',
              }}
            >
              {isArchive ? 'Archive' : "Today's"}
            </button>
          )}
          {gameOver ? (
            <button
              onClick={onShowResults}
              className="flex items-center gap-1 px-3 py-1.5 bit-btn text-sm font-medium"
              style={{
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              Results
            </button>
          ) : (
            <button
              onClick={onHintsOpen}
              className={`flex items-center gap-1 px-3 py-1.5 bit-btn text-sm font-medium overflow-hidden${hintsGlinting ? ' hints-glint' : ''}`}
              style={{
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              Hints
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
