import { useState, useEffect } from 'react'

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
  return sorted.map(v => v === 'correct' ? '●' : v === 'present' ? '○' : '—').join('')
}

const DIFFICULTY_SHARE = { lite: 'Lite', medium: 'Medium', challenge: 'Challenge' }

function buildShareText(puzzleId, coins, rankHistory, difficulty) {
  const n = rankHistory.length
  const diff = DIFFICULTY_SHARE[difficulty] ?? 'Medium'
  const header = `Reckon ${puzzleId} · ${diff}\n${coins}/100 · ${n} attempt${n !== 1 ? 's' : ''}`

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
  return (
    <div className="flex gap-0.5 items-center">
      {sorted.map((f, i) =>
        f === 'correct' ? (
          <span key={i} className="text-xs leading-none" style={{ color: 'var(--color-dot-correct)' }}>●</span>
        ) : f === 'present' ? (
          <span key={i} className="text-xs leading-none" style={{ color: 'var(--color-dot-present)' }}>○</span>
        ) : (
          <span key={i} className="text-xs leading-none" style={{ color: 'var(--color-text-faint)', opacity: 0.4 }}>—</span>
        )
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

export default function EndScreen({ puzzleId, coins, rankHistory, gameStatus, difficulty = 'medium', category, categoryGuessed, categoryText, categorySource, hailMaryTaken, isTutorial, keyMap, onGuessCategory, onClose, onComplete, completeCTA }) {
  const won = gameStatus === 'won'
  const showHailMary = gameStatus === 'abandoned' && !hailMaryTaken
  const grade = getGrade(coins)

  // Post-win bonus category guess (only when won without guessing category)
  const needsBonusGuess = won && !categoryGuessed && !isTutorial
  const [postWinGuess, setPostWinGuess] = useState(null) // null=pending, { correct }=done
  const [bonusQuery, setBonusQuery] = useState('')
  const [bonusLoading, setBonusLoading] = useState(false)
  const recapReady = !needsBonusGuess || postWinGuess !== null

  const [copied, setCopied] = useState(false)
  const recapCacheKey = puzzleId ? `recap-${puzzleId}` : null
  const [recap, setRecap] = useState(() => {
    try { return recapCacheKey ? (localStorage.getItem(recapCacheKey) ?? null) : null }
    catch { return null }
  })
  const [recapLoading, setRecapLoading] = useState(false)

  useEffect(() => {
    if (!recapReady || isTutorial || !category || recap) return
    setRecapLoading(true)
    fetch('/api/game-recap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempts: rankHistory.length,
        coins,
        won,
        category,
        categoryGuessed: !!categoryGuessed || !!postWinGuess?.correct,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const text = data?.recap ?? null
        setRecap(text)
        setRecapLoading(false)
        if (text && recapCacheKey) {
          try { localStorage.setItem(recapCacheKey, text) } catch {}
        }
      })
      .catch(() => setRecapLoading(false))
  }, [recapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleBonusGuess(e) {
    e.preventDefault()
    const q = bonusQuery.trim()
    if (!q) return
    setBonusLoading(true)
    const result = await onGuessCategory?.(q)
    setBonusLoading(false)
    setPostWinGuess({ correct: result?.outcome === 'hit' })
  }

  async function handleShare() {
    const text = buildShareText(puzzleId, coins, rankHistory, difficulty)
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
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5 relative"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lg leading-none"
          style={{ color: 'var(--color-text-faint)', opacity: 0.4 }}
          aria-label="Close"
        >
          ✕
        </button>
        {/* Headline */}
        <div className="text-center">
          <p className="text-2xl mb-1">{won ? '🎉' : '🏁'}</p>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-strong)' }}>
            {won ? 'You got it!' : 'Game over'}
          </h2>
          {categoryText && !(needsBonusGuess && postWinGuess === null) && (
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
              coins · {DIFFICULTY_SHARE[difficulty] ?? 'Medium'} · {grade}
            </p>
          </div>
          <AttemptsPreview rankHistory={rankHistory} />
        </div>

        {/* Haiku recap — async, shimmer while loading */}
        {!isTutorial && (recapLoading || recap) && (
          <p
            className={`text-xs italic text-center${recapLoading ? ' animate-pulse' : ' fade-in'}`}
            style={{ color: 'var(--color-text-faint)' }}
          >
            {recapLoading ? '···' : recap}
          </p>
        )}

        {needsBonusGuess && postWinGuess === null ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-strong)' }}>
              One guess at the category — what was the theme?
            </p>
            <form onSubmit={handleBonusGuess} className="flex gap-2">
              <input
                type="text"
                value={bonusQuery}
                onChange={e => setBonusQuery(e.target.value)}
                placeholder="The theme was…"
                className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
                style={{
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontSize: '16px',
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={!bonusQuery.trim() || bonusLoading}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0 disabled:opacity-40"
                style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
              >
                {bonusLoading ? '…' : '→'}
              </button>
            </form>
            <button
              onClick={() => setPostWinGuess({ correct: false })}
              className="text-xs text-center py-1"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Skip
            </button>
          </div>
        ) : (
          <>
            {needsBonusGuess && postWinGuess && (
              <p className="text-sm text-center fade-in" style={{ color: postWinGuess.correct ? 'var(--color-dot-correct)' : 'var(--color-text-faint)' }}>
                {postWinGuess.correct ? '✓ Got it!' : `The category was ${category}`}
              </p>
            )}
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
          </>
        )}
      </div>
    </div>
  )
}
