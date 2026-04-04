const NEEDED = 5

export default function TutorialBanner({ step, discoveredCount, rankHistoryLength = 0, onBegin, mode = 'learn' }) {
  if (step > 3 && mode === 'learn') return null
  if (step > 1 && mode === 'explore') return null

  // ── EXPLORE MODE (game 2) ──────────────────────────────────────────────────

  if (mode === 'explore') {
    if (step === 0) {
      return (
        <div
          className="fixed inset-0 z-60 flex flex-col items-center justify-center px-8 text-center"
          style={{ background: 'var(--color-bg)' }}
        >
          <div
            className="mb-6 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase"
            style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
          >
            TUTORIAL · GAME 2 OF 2
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: 'var(--color-text-strong)' }}>
            Now explore
          </h1>
          <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--color-text)' }}>
            10 items this time — only 5 belong in the ranking. Try these features as you play:
          </p>
          <ul
            className="text-left max-w-xs w-full mb-10 flex flex-col gap-2.5"
            style={{ color: 'var(--color-text)' }}
          >
            <li className="flex gap-3 text-sm">
              <span style={{ color: 'var(--color-text-strong)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>Tap <strong>Guess category</strong> (top right) to earn +15 bonus coins</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span style={{ color: 'var(--color-text-strong)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>Open the <strong>hint shop</strong> by tapping the coin bar at the bottom</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span style={{ color: 'var(--color-text-strong)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>Wrong guesses spend coins — watch your balance</span>
            </li>
          </ul>
          <button
            onClick={onBegin}
            className="w-full max-w-xs py-3.5 rounded-xl text-base font-bold"
            style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
          >
            Let's go →
          </button>
        </div>
      )
    }

    // Step 1: persistent tip strip
    return (
      <div
        className="shrink-0 px-4 py-3"
        style={{ background: 'var(--color-text-strong)', borderBottom: '1px solid var(--color-border)' }}
      >
        <p
          className="text-xs font-black uppercase tracking-widest mb-1.5"
          style={{ color: 'var(--color-bg)', opacity: 0.65 }}
        >
          TUTORIAL · GAME 2 OF 2
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-xs" style={{ color: 'var(--color-bg)', opacity: 0.9 }}>
            <strong>Guess category</strong> (top right) for +15 bonus coins
          </p>
          <p className="text-xs" style={{ color: 'var(--color-bg)', opacity: 0.9 }}>
            <strong>Hint shop</strong> — tap the hints button at the bottom right
          </p>
          <p className="text-xs" style={{ color: 'var(--color-bg)', opacity: 0.9 }}>
            Not all items are in the top 5 — so you might not even need to unlock them all!
          </p>
        </div>
      </div>
    )
  }

  // ── LEARN MODE (game 1) ────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div
        className="fixed inset-0 z-60 flex flex-col items-center justify-center px-8 text-center"
        style={{ background: 'var(--color-bg)' }}
      >
        <div
          className="mb-6 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase"
          style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
        >
          TUTORIAL · GAME 1 OF 2
        </div>
        <h1 className="text-3xl font-black mb-3" style={{ color: 'var(--color-text-strong)' }}>
          Welcome to Reckon
        </h1>
        <p className="text-base max-w-xs mb-10" style={{ color: 'var(--color-text)' }}>
          There's a secret ranked list. Find what's on it — then put the top 5 in order.
        </p>
        <button
          onClick={onBegin}
          className="w-full max-w-xs py-3.5 rounded-xl text-base font-bold"
          style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
        >
          Let's go →
        </button>
      </div>
    )
  }

  const submitted = rankHistoryLength > 0

  const STEPS = {
    1: {
      label: 'Step 1 of 3 — Find the items',
      instruction: "Type a name into the search box and hit Enter. If it's on the list, it appears in your bank.",
      progress: `Found ${discoveredCount} / ${NEEDED} needed`,
    },
    2: {
      label: 'Step 2 of 3 — Build a ranking',
      instruction: 'Tap a found item to fill a slot. Try a wrong order first — it\'s the best way to see how the feedback works.',
      progress: null,
    },
    3: submitted ? {
      label: 'Step 3 of 3 — Read your feedback',
      instruction: '● = right item, right spot · ○ = right item, wrong spot · no dot = not in the top 5. Adjust and submit again.',
      progress: null,
    } : {
      label: 'Step 3 of 3 — Submit your ranking',
      instruction: 'Fill all 5 slots, then hit Submit to see how close you are.',
      progress: null,
    },
  }

  const { label, instruction, progress } = STEPS[step]

  return (
    <div
      className="shrink-0 px-4 py-3"
      style={{ background: 'var(--color-text-strong)', borderBottom: '1px solid var(--color-border)' }}
    >
      <p
        className="text-xs font-black uppercase tracking-widest mb-1"
        style={{ color: 'var(--color-bg)', opacity: 0.65 }}
      >
        TUTORIAL · GAME 1 OF 2
      </p>
      <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--color-bg)' }}>
        {label}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-bg)', opacity: 0.85 }}>
        {instruction}
      </p>
      {progress && (
        <p className="text-xs mt-1.5 font-semibold" style={{ color: 'var(--color-bg)', opacity: 0.7 }}>
          {progress}
        </p>
      )}
    </div>
  )
}
