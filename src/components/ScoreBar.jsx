import { useRef, useState, useEffect } from 'react'
import { modalScrimBackground } from '../utils/modalScrim.js'

const COIN_EMOJI = '🪙'

const DIFFICULTY_LABELS = { lite: 'LITE', medium: 'MED', challenge: 'CHAL' }
const DIFFICULTY_ORDER = ['lite', 'medium', 'challenge']
const DIFFICULTY_NAMES = { lite: 'Lite', medium: 'Medium', challenge: 'Challenge' }

export default function ScoreBar({ coins, gameOver, difficulty = 'medium', hideDifficulty = false, onSetDifficulty, onHintsOpen, onShowResults, onReset }) {
  const prevCoins = useRef(coins)
  const [deltas, setDeltas] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)

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
            className="fixed inset-0 z-40"
            onClick={() => setPickerOpen(false)}
          >
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: modalScrimBackground({ variant: 'sheet' }), pointerEvents: 'none' }} />
          </div>
          <div
            className="absolute bottom-full left-0 right-0 z-50 px-4 pb-2"
            style={{ background: 'var(--color-bg)' }}
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <p className="text-[10px] font-black tracking-widest uppercase px-3 pt-2.5 pb-1" style={{ color: 'var(--color-text-faint)', opacity: 0.5 }}>
                Make it easier
              </p>
              {easierOptions.map(d => (
                <button
                  key={d}
                  onClick={() => { onSetDifficulty?.(d); setPickerOpen(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-strong)' }}>{DIFFICULTY_NAMES[d]}</span>
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

        {/* Reset button — truly centered via absolute positioning */}
        <button
          onClick={onReset}
          className="absolute left-1/2 -translate-x-1/2 flex items-center text-base px-2 py-1 rounded-lg"
          style={{ color: 'var(--color-text-faint)' }}
          aria-label="Reset session"
        >
          ↺
        </button>

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
