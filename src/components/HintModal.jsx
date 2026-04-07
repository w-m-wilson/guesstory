import { useState } from 'react'
import { GAME_CONFIG } from '../config.js'

const HINTS = [
  {
    key: 'revealBankItem',
    label: 'Reveal a bank item',
    description: 'Add one undiscovered item to your bank',
    cost: GAME_CONFIG.hints.revealBankItem,
  },
  {
    key: 'revealRankPositionKnown',
    label: 'Pin a discovered item',
    description: "Lock one item you've already found to its correct slot",
    cost: GAME_CONFIG.hints.revealRankPositionKnown,
  },
  {
    key: 'revealCategoryNudge',
    label: 'Category clue',
    description: 'Get a cryptic hint toward the hidden category',
    cost: GAME_CONFIG.hints.revealCategoryNudge,
  },
  {
    key: 'revealRankPositionUnknown',
    label: 'Pin an undiscovered item',
    description: "Reveal and lock an item you haven't found yet to its correct slot",
    cost: GAME_CONFIG.hints.revealRankPositionUnknown,
  },
  {
    key: 'revealCategory',
    label: 'Reveal category',
    description: 'Show the full hidden category label',
    cost: GAME_CONFIG.hints.revealCategory,
  },
]

export default function HintModal({ coins, allBankFound, categoryGuessed, category, onPurchase, onClose }) {
  const [feedback, setFeedback] = useState(null)
  const [nudgeLoading, setNudgeLoading] = useState(false)

  async function handlePurchase(key) {
    if (key === 'revealCategoryNudge') {
      onPurchase(key)
      setNudgeLoading(true)
      setFeedback(null)
      try {
        const res = await fetch('/api/category-nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category }),
        })
        const data = res.ok ? await res.json() : null
        setFeedback(data?.clue ?? 'No clue available right now.')
      } catch {
        setFeedback('No clue available right now.')
      } finally {
        setNudgeLoading(false)
      }
      return
    }

    const result = onPurchase(key)
    if (result?.noneFound) {
      setFeedback("None of your discovered items are in the top 5.")
    } else if (result?.fellBackToKnown) {
      setFeedback(`No undiscovered items left to pin — pinned a discovered one instead (${GAME_CONFIG.hints.revealRankPositionKnown} coins).`)
    } else {
      onClose()
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="w-full max-w-[430px] rounded-t-2xl p-5 pb-8"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-base" style={{ color: 'var(--color-text-strong)' }}>
            Hints
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
              🪙 {coins}
            </span>
            <button
              onClick={onClose}
              className="text-lg leading-none"
              style={{ color: 'var(--color-text-faint)' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {(feedback || nudgeLoading) && (
          <p className="text-sm mb-3 px-1 italic" style={{ color: 'var(--color-text-faint)' }}>
            {nudgeLoading ? 'Getting a clue…' : feedback}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {HINTS.map(({ key, label, description, cost }) => {
            const canAfford = coins >= cost
            const unavailable =
              (key === 'revealBankItem' && allBankFound) ||
              (key === 'revealCategory' && categoryGuessed) ||
              (key === 'revealCategoryNudge' && categoryGuessed)
            return (
              <button
                key={key}
                onClick={() => handlePurchase(key)}
                disabled={!canAfford || unavailable}
                className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-left disabled:opacity-40"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-strong)' }}>
                    {label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                    {description}
                  </p>
                </div>
                <span
                  className="text-sm font-semibold ml-3 shrink-0"
                  style={{ color: canAfford ? 'var(--color-text-strong)' : 'var(--color-text-faint)' }}
                >
                  🪙 {String(cost)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
