import { useState } from 'react'
import { modalScrimBackground } from '../utils/modalScrim.js'

const EXIT_MS = 200

const SECTIONS = [
  {
    heading: 'What is this?',
    body: "There's a secret ranked list. Your job is to figure out what's on it — and then put the top 5 in the right order.",
  },
  {
    heading: 'Step 1 — Find the items',
    items: [
      'Type a name into the search box and submit it',
      "If it's on the list, it gets added to your bank",
      'Your first 3 wrong guesses are free — after that, misses cost coins (varies by difficulty)',
      'Stars (★) mark items you were given as starting hints',
    ],
  },
  {
    heading: 'Step 2 — Rank the top 5',
    items: [
      'Tap a bank item to slot it into your ranking — tap it again to remove it',
      'Fill all 5 slots, then hit Submit',
      'After each attempt, dots appear for items that belong in the top 5:',
    ],
    feedback: [
      { symbol: '●', color: 'var(--color-dot-correct)', label: 'Right item, right spot' },
      { symbol: '○', color: 'var(--color-dot-present)', label: 'Right item, wrong spot' },
      { symbol: '—', color: 'var(--color-text-faint)',  label: 'Not in the top 5 — no dot' },
    ],
  },
  {
    heading: 'Guess the category',
    items: [
      'Tap the button in the header bar to guess the theme of the ranked list',
      'Nail it and earn +15 bonus coins',
      'You get 3 free tries — after that, wrong guesses cost coins',
      'Close guesses get a nudge in the right direction',
    ],
  },
  {
    heading: 'Hints',
    items: [
      'Tap Hints in the score bar at the bottom to open the hint shop',
      'Reveal the category — 40 coins',
      'Add a hidden item to your bank — 5 coins',
      'Pin a discovered item to its correct slot — 10 coins',
      'Pin an undiscovered item to its correct slot — 30 coins',
    ],
  },
  {
    heading: 'Coins',
    body: 'You start with 100 coins. Wrong guesses and hints spend them. Hit zero and the game ends — so spend wisely.',
  },
  {
    heading: 'Difficulty & settings',
    body: 'Choose your difficulty at the start of each puzzle. Open the menu (≡) at the top right to change appearance, adjust difficulty mid-game, or reset the puzzle.',
  },
]

export default function IntroModal({ onClose, onReplayTutorial }) {
  const [closing, setClosing] = useState(false)
  function close(cb) {
    if (closing) return
    setClosing(true)
    setTimeout(() => { onClose(); cb?.() }, EXIT_MS)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: modalScrimBackground({ variant: 'dialog' }), ...(closing ? { opacity: 0, transition: `opacity ${EXIT_MS}ms ease` } : { animation: 'scrimIn 0.2s ease' }) }}
      onClick={() => close()}
    >
      <div style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35)) drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}>
      <div
        className={`w-full max-w-sm flex flex-col${closing ? '' : ' dialog-enter'}`}
        style={{ background: 'var(--color-bg)', maxHeight: '85dvh', clipPath: 'polygon(0% 8px, 2px 6px, 4px 4px, 6px 2px, 8px 0%, calc(100% - 8px) 0%, calc(100% - 6px) 2px, calc(100% - 4px) 4px, calc(100% - 2px) 6px, 100% 8px, 100% calc(100% - 8px), calc(100% - 2px) calc(100% - 6px), calc(100% - 4px) calc(100% - 4px), calc(100% - 6px) calc(100% - 2px), calc(100% - 8px) 100%, 8px 100%, 6px calc(100% - 2px), 4px calc(100% - 4px), 2px calc(100% - 6px), 0% calc(100% - 8px))', ...(closing ? { opacity: 0, transform: 'scale(0.95) translateY(6px)', transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease` } : {}) }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-strong)' }}>
            How to play
          </h2>
          <button
            onClick={() => close()}
            className="text-lg leading-none opacity-50 hover:opacity-100"
            style={{ color: 'var(--color-text-faint)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {SECTIONS.map(({ heading, body, items, feedback }) => (
            <div key={heading}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--color-text-faint)' }}>
                {heading}
              </p>

              {body && (
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {body}
                </p>
              )}

              {items && (
                <ul className="flex flex-col gap-1">
                  {items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                      <span style={{ color: 'var(--color-text-faint)' }}>·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {feedback && (
                <div className="mt-2 flex flex-col gap-1 pl-3">
                  {feedback.map(({ symbol, color, label }) => (
                    <div key={label} className="flex items-center gap-2.5 text-sm">
                      <span
                        className="text-base leading-none w-4 text-center shrink-0"
                        style={{ color }}
                      >
                        {symbol}
                      </span>
                      <span style={{ color: 'var(--color-text)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div
          className="px-5 pb-5 pt-3 shrink-0 flex flex-col gap-2"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => close()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: 'var(--color-action)',
              color: 'var(--color-action-text)',
            }}
          >
            Got it — let's play
          </button>
          {onReplayTutorial && (
            <button
              onClick={() => close(onReplayTutorial)}
              className="w-full py-2 rounded-xl text-sm"
              style={{
                color: 'var(--color-text-faint)',
                border: '1px solid var(--color-border)',
              }}
            >
              Replay tutorial
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
