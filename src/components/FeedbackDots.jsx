/**
 * FeedbackDots — renders 5 feedback values as monochrome dot symbols.
 *
 * props:
 *   feedback    array[5] of 'correct' | 'present' | 'absent' | 'empty'
 *   spoilerFree boolean (default false)
 *     false → full Mastermind detail (two luminance levels for correct vs present)
 *     true  → fact-of only: ● in-top-5, ○ not-top-5, ✗ empty (no position info leaked)
 */
export default function FeedbackDots({ feedback, spoilerFree = false }) {
  return (
    <span className="flex gap-1 items-center">
      {feedback.map((value, i) => (
        <Dot key={i} value={value} spoilerFree={spoilerFree} />
      ))}
    </span>
  )
}

function Dot({ value, spoilerFree }) {
  if (spoilerFree) {
    return <SpoilerFreeDot value={value} />
  }
  return <MastermindDot value={value} />
}

function MastermindDot({ value }) {
  if (value === 'correct') {
    return (
      <span
        className="text-base leading-none"
        style={{ color: 'var(--color-dot-correct)' }}
        aria-label="correct position"
      >
        ●
      </span>
    )
  }
  if (value === 'present') {
    return (
      <span
        className="text-base leading-none"
        style={{ color: 'var(--color-dot-correct)' }}
        aria-label="in top 5, wrong position"
      >
        ○
      </span>
    )
  }
  // absent or empty — render nothing
  return null
}

function SpoilerFreeDot({ value }) {
  if (value === 'correct' || value === 'present') {
    return (
      <span
        className="text-base leading-none"
        style={{ color: 'var(--color-dot-correct)' }}
        aria-label="in top 5"
      >
        ●
      </span>
    )
  }
  if (value === 'absent') {
    return (
      <span
        className="text-base leading-none"
        style={{ color: 'var(--color-dot-present)' }}
        aria-label="not in top 5"
      >
        ○
      </span>
    )
  }
  // empty
  return (
    <span
      className="text-base leading-none"
      style={{ color: 'var(--color-dot-absent)', opacity: 0.4 }}
      aria-label="empty"
    >
      ✗
    </span>
  )
}
