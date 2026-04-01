import GuessHistory from './GuessHistory.jsx'

const GRADES = [
  { min: 100, label: 'Perfect' },
  { min: 85,  label: 'Excellent' },
  { min: 70,  label: 'Great' },
  { min: 50,  label: 'Good' },
  { min: 0,   label: 'Keep practicing' },
]

function getGrade(coins) {
  return GRADES.find(g => coins >= g.min)?.label ?? 'Keep practicing'
}

function buildShareText(puzzleId, coins, rankHistory) {
  const lines = [`Rankie ${puzzleId}`, `Score: ${coins}/100`, '', 'Ranking attempts:']
  for (const { feedback } of rankHistory) {
    lines.push(
      feedback.map(v => {
        if (v === 'correct' || v === 'present') return '●'
        if (v === 'absent') return '○'
        return '✗'
      }).join(' ')
    )
  }
  return lines.join('\n')
}

export default function EndScreen({ puzzleId, coins, rankHistory, gameStatus, keyMap, onClose }) {
  const won = gameStatus === 'won'
  const grade = getGrade(coins)

  async function handleShare() {
    const text = buildShareText(puzzleId, coins, rankHistory)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // silent fallback
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Headline */}
        <div className="text-center">
          <p className="text-2xl mb-1">{won ? '🎉' : '🏁'}</p>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-strong)' }}>
            {won ? 'You got it!' : 'Game over'}
          </h2>
        </div>

        {/* Score */}
        <div className="text-center">
          <p className="text-5xl font-black tabular-nums" style={{ color: 'var(--color-text-strong)' }}>
            {coins}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-faint)' }}>
            coins remaining · {grade}
          </p>
        </div>

        {/* Attempt history reusing GuessHistory (spoiler-free, key-based) */}
        {rankHistory.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-faint)' }}>
              Ranking attempts
            </p>
            <GuessHistory rankHistory={rankHistory} keyMap={keyMap} />
          </div>
        )}

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: 'var(--color-text-strong)',
            color: 'var(--color-bg)',
          }}
        >
          Copy result
        </button>
      </div>
    </div>
  )
}
