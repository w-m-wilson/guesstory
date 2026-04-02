import { useState } from 'react'
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
  const lines = [`Reckon ${puzzleId}`, `Score: ${coins}/100`]
  for (const { feedback } of rankHistory) {
    const dots = [...feedback]
      .sort((a, b) => ({ correct: 0, present: 1 }[a] ?? 2) - ({ correct: 0, present: 1 }[b] ?? 2))
      .map(v => v === 'correct' ? '●' : v === 'present' ? '○' : null)
      .filter(Boolean)
      .join('')
    lines.push(dots || '—')
  }
  return lines.join('\n')
}

export default function EndScreen({ puzzleId, coins, rankHistory, gameStatus, categoryText, categorySource, hailMaryTaken, keyMap, onClose, onComplete }) {
  const won = gameStatus === 'won'
  const showHailMary = gameStatus === 'abandoned' && !hailMaryTaken
  const grade = getGrade(coins)
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const text = buildShareText(puzzleId, coins, rankHistory)
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // user cancelled or API unsupported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
          {categoryText && (
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-faint)' }}>
              The category was{' '}
              <span style={{ color: 'var(--color-text-strong)', fontStyle: 'italic' }}>
                {categoryText}
              </span>
              {categorySource && (
                <>
                  {' '}
                  <a
                    href={categorySource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs"
                    style={{ color: 'var(--color-text-faint)', textDecoration: 'underline' }}
                  >
                    source
                  </a>
                </>
              )}
            </p>
          )}
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
            <GuessHistory rankHistory={rankHistory} />
          </div>
        )}

        {onComplete ? (
          <button
            onClick={() => { onClose(); onComplete(); }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
          >
            Play today's puzzle →
          </button>
        ) : showHailMary ? (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
          >
            Take your Hail Mary →
          </button>
        ) : (
          <button
            onClick={handleShare}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
          >
            {copied ? 'Copied!' : 'Share result'}
          </button>
        )}
      </div>
    </div>
  )
}
