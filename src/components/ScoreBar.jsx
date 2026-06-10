import { useRef, useState, useEffect } from 'react'
import { modalScrimBackground } from '../utils/modalScrim.js'

const COIN_EMOJI = '🪙'

const DIFFICULTY_LABELS = { lite: 'LITE', medium: 'MED', challenge: 'CHAL' }
const DIFFICULTY_ORDER = ['lite', 'medium', 'challenge']
const DIFFICULTY_NAMES = { lite: 'Lite', medium: 'Medium', challenge: 'Challenge' }
const DIFFICULTY_BLURBS = { lite: 'Most answers given', medium: 'A few starting hints', challenge: 'No hints — from scratch' }

const PICKER_EXIT_MS = 160

export default function ScoreBar({ coins, gameOver, difficulty = 'medium', hideDifficulty = false, onSetDifficulty, onHintsOpen, onShowResults }) {
  const prevCoins = useRef(coins)
  const [deltas, setDeltas] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerClosing, setPickerClosing] = useState(false)
  const pickerTimerRef = useRef(null)

  function openPicker() { setPickerClosing(false); setPickerOpen(true) }
  function closePicker(cb) {
    if (pickerClosing) return
    setPickerClosing(true)
    clearTimeout(pickerTimerRef.current)
    pickerTimerRef.current = setTimeout(() => {
      setPickerOpen(false)
      setPickerClosing(false)
      cb?.()
    }, PICKER_EXIT_MS)
  }

  useEffect(() => () => clearTimeout(pickerTimerRef.current), [])

  useEffect(() => {
    const delta = prevCoins.current - coins
    if (delta !== 0) {
      const id = Date.now()
      setDeltas(prev => [...prev, { id, amount: Math.abs(delta), positive: delta < 0 }])
      setTimeout(() => {
        setDeltas(prev => prev.filter(d => d.id !== id))
      }, 1500)
    }
    prevCoins.current = coins
  }, [coins])

  // Options easier than current difficulty (downgrade only mid-game)
  const easierOptions = DIFFICULTY_ORDER.slice(0, DIFFICULTY_ORDER.indexOf(difficulty))
  const canSwitch = !hideDifficulty && easierOptions.length > 0

  return (
    <div style={{ position: 'relative' }}>
      {/* Mid-game difficulty picker — appears above the bar */}
      {pickerOpen && !hideDifficulty && (
        <>
          <div
            className="fixed inset-0 z-[45]"
            onClick={() => closePicker()}
            style={pickerClosing ? { opacity: 0, transition: `opacity ${PICKER_EXIT_MS}ms ease` } : { animation: 'scrimIn 0.18s ease' }}
          >
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: modalScrimBackground({ variant: 'sheet' }), pointerEvents: 'none' }} />
          </div>
          <div
            className={`absolute bottom-full left-4 z-[46] pb-2${pickerClosing ? '' : ' sheet-enter'}`}
            style={pickerClosing ? { opacity: 0, transform: 'translateY(12px)', transition: `opacity ${PICKER_EXIT_MS}ms ease, transform ${PICKER_EXIT_MS}ms ease` } : {}}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 -6px 24px rgba(0,0,0,0.14)',
                minWidth: '180px',
              }}
            >
              <p className="text-[10px] font-black tracking-widest uppercase px-4 pt-3 pb-1.5" style={{ color: 'var(--color-text-faint)', opacity: 0.5 }}>
                Make it easier
              </p>
              {easierOptions.map(d => (
                <button
                  key={d}
                  onClick={() => closePicker(() => onSetDifficulty?.(d))}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-strong)' }}>{DIFFICULTY_NAMES[d]}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>{DIFFICULTY_BLURBS[d]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        className="relative flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        {/* Coin display + difficulty badge */}
        <div className="flex items-center gap-2 relative">
          <span className="text-base">{COIN_EMOJI}</span>

          <span
            key={coins}
            className="coin-pulse text-xl font-bold tabular-nums"
            style={{ color: 'var(--color-dot-present)' }}
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
              onClick={canSwitch ? () => (pickerOpen ? closePicker() : openPicker()) : undefined}
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

        {/* Results or Hints */}
        {gameOver ? (
          <button
            onClick={onShowResults}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
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
  )
}
