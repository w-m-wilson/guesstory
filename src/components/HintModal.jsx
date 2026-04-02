import { GAME_CONFIG } from '../config.js'

const HINTS = [
  {
    key: 'revealCategory',
    label: 'Reveal category',
    description: 'Show the hidden category label',
    cost: `${GAME_CONFIG.hints.revealCategory}`,
  },
  {
    key: 'revealBankItem',
    label: 'Reveal a bank item',
    description: 'Add one undiscovered item to your bank',
    cost: `${GAME_CONFIG.hints.revealBankItem}`,
  },
  {
    key: 'revealRankPosition',
    label: 'Lock an item to its slot',
    description: 'Pins one item to its correct position',
    cost: `${GAME_CONFIG.hints.revealRankPositionKnown}–${GAME_CONFIG.hints.revealRankPositionUnknown}`,
  },
]

export default function HintModal({ coins, onPurchase, onClose }) {
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
          <button
            onClick={onClose}
            className="text-lg leading-none"
            style={{ color: 'var(--color-text-faint)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {HINTS.map(({ key, label, description, cost }) => {
            const minCost = parseInt(cost)
            const canAfford = coins >= minCost
            return (
              <button
                key={key}
                onClick={() => { onPurchase(key); onClose() }}
                disabled={!canAfford}
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
                  🪙 {cost}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
