import { GAME_CONFIG } from '../config.js'

const { bank, category, ranking, hints } = GAME_CONFIG

const SECTIONS = [
  {
    heading: 'Goal',
    body: 'Discover items from a hidden ranked list, then arrange the top 5 in the correct order.',
  },
  {
    heading: 'Guess names',
    items: [
      `Type any name — fuzzy matching will find it if it's in the list`,
      `You get ${bank.freeMisses} free misses; after that each wrong guess costs ${bank.missCost} coin`,
      'Tap a discovered item to place it in your ranking',
    ],
  },
  {
    heading: 'Submit a ranking',
    items: [
      'Arrange items in your best guess of the correct order, then hit Submit',
      'Each wrong submission costs coins',
      'Read the Mastermind feedback to refine your next attempt:',
    ],
    feedback: [
      { symbol: '●', label: 'Correct position' },
      { symbol: '○', label: 'In the top 5, but wrong position' },
      { symbol: '—', label: 'None of your picks are in the top 5' },
    ],
  },
  {
    heading: 'Guess the category',
    items: [
      'Tap "Guess category" in the header to reveal the theme',
      `Guess correctly and earn +${category.correctGuessBonus} bonus coins`,
      `You get ${category.freeMisses} free tries before wrong guesses cost coins`,
    ],
  },
  {
    heading: 'Hints',
    items: [
      `Reveal category — ${hints.revealCategory} coins`,
      `Reveal a bank item — ${hints.revealBankItem} coins`,
      `Pin an item to its correct rank — ${hints.revealRankPosition} coins`,
    ],
  },
  {
    heading: 'Coins',
    body: `You start with ${GAME_CONFIG.startingCoins} coins. Spend them on guesses and hints. Run out and it's game over — so play smart.`,
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
