import { useRef, useState, useEffect } from 'react'

const COIN_EMOJI = '🪙'

export default function ScoreBar({ coins, gameOver, onHintsOpen, onShowResults, onReset }) {
  const prevCoins = useRef(coins)
  // { id, amount, positive }
  const [deltas, setDeltas] = useState([])

  useEffect(() => {
    const delta = prevCoins.current - coins
    if (delta !== 0) {
      const id = Date.now()
      setDeltas(prev => [...prev, { id, amount: Math.abs(delta), positive: delta < 0 }])
      setTimeout(() => {
        setDeltas(prev => prev.filter(d => d.id !== id))
      }, 1000)
    }
    prevCoins.current = coins
  }, [coins])

  return (
    <div
      className="flex items-center justify-between px-4 py-3 shrink-0"
      style={{ borderTop: '1px solid var(--color-border)' }}
    >
      {/* Coin display */}
      <div className="flex items-center gap-2 relative">
        <span className="text-base">{COIN_EMOJI}</span>

        {/* Pulse on every change by remounting via key */}
        <span
          key={coins}
          className="coin-pulse text-xl font-bold tabular-nums"
          style={{ color: 'var(--color-text-strong)' }}
        >
          {coins}
        </span>

        {/* Floating delta labels */}
        {deltas.map(({ id, amount, positive }) => (
          <span
            key={id}
            className="coin-float absolute left-6 text-base font-bold"
            style={{
              color: 'var(--color-text-strong)',
              top: '-6px',
            }}
          >
            {positive ? `+${amount}` : `−${amount}`}
          </span>
        ))}
      </div>

      {/* Reset button — center */}
      <button
        onClick={onReset}
        className="text-xs font-medium px-2 py-1 rounded-lg"
        style={{ color: 'var(--color-text-faint)' }}
        aria-label="Reset session"
      >
        ↺ Reset
      </button>

      {/* Results button (post-game) or Hints button (during game) */}
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
  )
}
