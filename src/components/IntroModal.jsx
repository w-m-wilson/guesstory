import { GAME_CONFIG } from '../config.js'

const { bank, category, ranking, hints } = GAME_CONFIG

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
      `Your first ${bank.freeMisses} wrong guesses are free — after that, each miss costs 1 coin`,
      'The counter at the top right of the bank shows how many you\'ve found so far',
    ],
  },
  {
    heading: 'Step 2 — Rank the top 5',
    items: [
      'Tap a bank item to slot it into your ranking — tap it again to remove it',
      'Fill all 5 slots, then hit Submit',
      'After each attempt, circles appear for items that belong in the top 5:',
    ],
    feedback: [
      { symbol: '●', color: 'var(--color-dot-correct)', label: 'Right item, right spot' },
      { symbol: '○', color: 'var(--color-dot-correct)', label: 'Right item, wrong spot' },
      { symbol: '—', color: 'var(--color-text-faint)',  label: "Not in the top 5 — no dot shown" },
    ],
  },
  {
    heading: 'Guess the category',
    items: [
      'See the "Guess category" button at the top right? That\'s the theme of the list',
      `Nail it and earn +${category.correctGuessBonus} bonus coins`,
      `You get ${category.freeMisses} free tries — after that, wrong guesses cost ${category.missCost} coins each`,
      "Close guesses get a hint nudging you in the right direction",
    ],
  },
  {
    heading: 'Hints',
    items: [
      'Tap the coin bar at the bottom to open the hint shop',
      `Reveal the category — ${hints.revealCategory} coins`,
      `Add a hidden item to your bank — ${hints.revealBankItem} coins`,
      `Pin a discovered item to its correct slot — ${hints.revealRankPositionKnown} coins`,
      `Pin an undiscovered item to its correct slot — ${hints.revealRankPositionUnknown} coins`,
    ],
  },
  {
    heading: 'Coins',
    body: `You start with ${GAME_CONFIG.startingCoins} coins. Wrong guesses and hints spend them. Hit zero and the game ends — so spend wisely.`,
  },
  {
    heading: 'Appearance',
    body: 'Tap the ⚙ icon next to the ? to switch between light, dark, and system mode — and choose from three color themes.',
  },
]

export default function IntroModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl flex flex-col fade-in"
        style={{
          background: 'var(--color-bg)',
          maxHeight: '85dvh',
        }}
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
            onClick={onClose}
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
        <div className="px-5 pb-5 pt-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: 'var(--color-text-strong)',
              color: 'var(--color-bg)',
            }}
          >
            Got it — let's play
          </button>
        </div>
      </div>
    </div>
  )
}
