import { GAME_CONFIG } from '../config.js'

const { bank, category, ranking, hints } = GAME_CONFIG

const SECTIONS = [
  {
    heading: 'What is this?',
    body: 'There\'s a secret ranked list. Your job is to figure out what\'s on it — and then put the top 5 in the right order.',
  },
  {
    heading: 'Step 1 — Find the items',
    items: [
      'Type a name into the box and submit it',
      'If it\'s on the list, it gets added to your collection',
      `You get ${bank.freeMisses} wrong guesses for free — after that, misses cost coins`,
    ],
  },
  {
    heading: 'Step 2 — Rank the top 5',
    items: [
      'Tap any item you\'ve found to add it to your ranking',
      'Arrange 5 items in order from #1 to #5, then hit Submit',
      'After each attempt you\'ll see dots that hint at what\'s right:',
    ],
    feedback: [
      { symbol: '●', label: 'Right item, right spot' },
      { symbol: '○', label: 'Right item, wrong spot' },
      { symbol: '—', label: 'That item isn\'t in the top 5' },
    ],
  },
  {
    heading: 'Guess the category',
    items: [
      'Not sure what the list is about? Tap the category button at the top',
      `Guess it right and earn +${category.correctGuessBonus} bonus coins`,
      `You get ${category.freeMisses} free tries before wrong guesses cost coins`,
    ],
  },
  {
    heading: 'Hints',
    items: [
      `Stuck? Spend coins to get help`,
      `Show the category — ${hints.revealCategory} coins`,
      `Reveal a hidden item — ${hints.revealBankItem} coins`,
      `Lock an item into its correct spot — ${hints.revealRankPosition} coins`,
    ],
  },
  {
    heading: 'Coins',
    body: `You start with ${GAME_CONFIG.startingCoins} coins. Wrong guesses and hints spend them. Hit zero and the game ends — so spend wisely.`,
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
                  {feedback.map(({ symbol, label }) => (
                    <div key={symbol} className="flex items-center gap-2.5 text-sm">
                      <span
                        className="font-semibold w-4 text-center shrink-0"
                        style={{ color: 'var(--color-dot-correct)' }}
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
