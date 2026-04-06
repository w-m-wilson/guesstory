import { useState } from 'react'

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

function feedbackDots({ feedback }) {
  const sorted = [...feedback].sort(
    (a, b) => ({ correct: 0, present: 1 }[a] ?? 2) - ({ correct: 0, present: 1 }[b] ?? 2)
  )
  const dots = sorted.map(v => v === 'correct' ? '●' : v === 'present' ? '○' : null).filter(Boolean).join('')
  return dots || '—'
}

function buildShareText(puzzleId, coins, rankHistory) {
  const n = rankHistory.length
  const header = `Reckon ${puzzleId}\n${coins}/100 · ${n} attempt${n !== 1 ? 's' : ''}`

  const truncated = n > HEAD + TAIL
  const visible = truncated
    ? [...rankHistory.slice(0, HEAD), null, ...rankHistory.slice(-TAIL)]
    : rankHistory

  const lines = [header, ...visible.map(a => a === null ? '···' : feedbackDots(a))]
  return lines.join('\n')
}

function DotRow({ feedback }) {
  const sorted = [...feedback].sort(
    (a, b) => ({ correct: 0, present: 1 }[a] ?? 2) - ({ correct: 0, present: 1 }[b] ?? 2)
  )
  const hasAny = sorted.some(f => f === 'correct' || f === 'present')
  return (
    <div className="flex gap-0.5 items-center">
      {hasAny ? sorted.map((f, i) =>
        f === 'correct' ? (
          <span key={i} className="text-xs leading-none" style={{ color: 'var(--color-dot-correct)' }}>●</span>
        ) : f === 'present' ? (
          <span key={i} className="text-xs leading-none" style={{ color: 'var(--color-dot-present)' }}>○</span>
        ) : null
      ) : (
        <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>—</span>
      )}
    </div>
  )
}

const HEAD = 1
const TAIL = 2

function AttemptsPreview({ rankHistory }) {
  if (rankHistory.length === 0) return null
  const truncated = rankHistory.length > HEAD + TAIL
  const visible = truncated
    ? [...rankHistory.slice(0, HEAD), null, ...rankHistory.slice(-TAIL)]
    : rankHistory

  return (
    <div>
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-faint)' }}>
        {rankHistory.length} attempt{rankHistory.length !== 1 ? 's' : ''}
      </p>
      <div className="flex flex-col gap-1">
        {visible.map((attempt, i) =>
          attempt === null ? (
            <p key="gap" className="text-xs" style={{ color: 'var(--color-text-faint)' }}>· · ·</p>
          ) : (
            <DotRow key={i} feedback={attempt.feedback} />
          )
        )}
      </div>
    </div>
  )
}

export default function EndScreen({ puzzleId, coins, rankHistory, gameStatus, categoryText, categorySource, hailMaryTaken, keyMap, onClose, onComplete, completeCTA }) {
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

        {/* Score + attempts side by side */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-5xl font-black tabular-nums" style={{ color: 'var(--color-text-strong)' }}>
              {coins}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-faint)' }}>
              coins remaining · {grade}
            </p>
          </div>
          <AttemptsPreview rankHistory={rankHistory} />
        </div>

        {onComplete ? (
          <button
            onClick={() => { onClose(); onComplete(); }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
          >
            {completeCTA ?? 'Play today\'s puzzle →'}
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
