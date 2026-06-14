import { useState } from 'react'
import { DIFFICULTY_CONFIG } from '../config.js'
import { modalScrimBackground } from '../utils/modalScrim.js'
import PixelCoin from './PixelCoin.jsx'

const HINT_DEFS = [
  { key: 'revealBankItem',            label: 'Reveal a bank item',        description: 'Add one undiscovered item to your bank' },
  { key: 'revealRankPositionKnown',   label: 'Pin a discovered item',     description: "Lock one item you've already found to its correct slot" },
  { key: 'revealCategoryNudge',       label: 'Category clue',             description: 'Get a hint toward the hidden category' },
  { key: 'revealRankPositionUnknown', label: 'Pin an undiscovered item',   description: "Reveal and lock an item you haven't found yet to its correct slot" },
  { key: 'revealCategory',            label: 'Reveal category',            description: 'Show the full hidden category label' },
]

const EXIT_MS = 200

const RAISED_BG = 'linear-gradient(to bottom, var(--color-bg-raised) 0%, var(--color-bg-raised) 48%, var(--color-bg-elevated) 49%, color-mix(in srgb, black 10%, var(--color-bg-elevated)) 100%)'
const RAISED_WRAP = { filter: 'drop-shadow(0 3px 0 var(--color-raised-shadow))' }
const EMPTY_STYLE = {
  background: 'linear-gradient(to bottom, color-mix(in srgb, var(--color-text) 8%, var(--color-bg-elevated)) 0%, color-mix(in srgb, var(--color-text) 5%, var(--color-bg-elevated)) 100%)',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)',
  border: '1px solid color-mix(in srgb, var(--color-text) 10%, transparent)',
}
const PRESSED_STYLE = {
  background: 'linear-gradient(to bottom, color-mix(in srgb, var(--color-action) 18%, var(--color-bg-elevated)) 0%, color-mix(in srgb, var(--color-action) 10%, var(--color-bg-elevated)) 100%)',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.28)',
  border: '1px solid color-mix(in srgb, var(--color-action) 30%, transparent)',
}

export default function HintModal({ coins, allBankFound, categoryGuessed, category, difficulty = 'medium', onPurchase, onClose }) {
  const hintCosts = (DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.medium).hints
  const HINTS = HINT_DEFS.map(h => ({ ...h, cost: hintCosts[h.key] }))
  const [feedback, setFeedback] = useState(null)
  const [nudgeLoading, setNudgeLoading] = useState(false)
  const [closing, setClosing] = useState(false)

  function close() { if (closing) return; setClosing(true); setTimeout(onClose, EXIT_MS) }

  async function handlePurchase(key) {
    if (key === 'revealCategoryNudge') {
      onPurchase(key)
      setNudgeLoading(true)
      setFeedback(null)
      try {
        const res = await fetch('/api/category-nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_API_SECRET },
          body: JSON.stringify({ category, difficulty }),
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
      setFeedback(`No undiscovered items left to pin — pinned a discovered one instead (${hintCosts.revealRankPositionKnown} coins).`)
    } else {
      onClose()
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={close}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: modalScrimBackground({ variant: 'sheet' }), pointerEvents: 'none', ...(closing ? { opacity: 0, transition: `opacity ${EXIT_MS}ms ease` } : { animation: 'scrimIn 0.2s ease' }) }} />
      {/* Card */}
      <div
        className={`w-full max-w-[430px] p-5 pb-8${closing ? '' : ' sheet-enter'}`}
        style={{ background: 'var(--color-bg-elevated)', position: 'relative', zIndex: 1, clipPath: 'polygon(0% 8px, 2px 6px, 4px 4px, 6px 2px, 8px 0%, calc(100% - 8px) 0%, calc(100% - 6px) 2px, calc(100% - 4px) 4px, calc(100% - 2px) 6px, 100% 8px, 100% 100%, 0% 100%)', ...(closing ? { opacity: 0, transform: 'translateY(24px)', transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease` } : {}) }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-base" style={{ color: 'var(--color-text-strong)' }}>
            Hints
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-faint)' }}>
              <PixelCoin size={14} /> {coins}
            </span>
            <button
              onClick={close}
              className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
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
            const disabled = !canAfford || unavailable
            const state = unavailable ? 'pressed' : !canAfford ? 'empty' : 'raised'
            return (
              <span key={key} style={state === 'raised' ? RAISED_WRAP : undefined}>
                <button
                  onClick={() => handlePurchase(key)}
                  disabled={disabled}
                  className="flex items-center justify-between w-full bit-btn px-4 py-3 text-left"
                  style={{
                    ...(state === 'raised' ? { background: RAISED_BG } : state === 'pressed' ? PRESSED_STYLE : EMPTY_STYLE),
                    opacity: state === 'empty' ? 0.5 : 1,
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
                    className="text-sm font-semibold ml-3 shrink-0 flex items-center gap-1"
                    style={{ color: 'var(--color-text-strong)' }}
                  >
                    <PixelCoin size={14} /> {String(cost)}
                  </span>
                </button>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
