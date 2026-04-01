import { useRef, useState, useEffect } from 'react'

const COIN_EMOJI = '🪙'

export default function ScoreBar({ coins, onHintsOpen, onReset }) {
  const prevCoins = useRef(coins)
  const [deductions, setDeductions] = useState([]) // [{ id, amount }]

  useEffect(() => {
    const delta = prevCoins.current - coins
    if (delta > 0) {
      const id = Date.now()
      setDeductions(prev => [...prev, { id, amount: delta }])
      setTimeout(() => {
        setDeductions(prev => prev.filter(d => d.id !== id))
      }, 950)
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
        <span
          className="text-lg font-semibold tabular-nums"
          style={{ color: 'var(--color-text-strong)' }}
        >
          {coins}
        </span>

        {/* Floating deduction animations */}
        {deductions.map(({ id, amount }) => (
          <span
            key={id}
            className="coin-deduct absolute left-6 text-sm font-medium"
            style={{ color: 'var(--color-text-faint)', top: '-4px' }}
          >
            −{amount}
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

      {/* Hints button */}
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
    </div>
  )
}
