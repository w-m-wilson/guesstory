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
            10 items this time. Only 5 belong in the ranking. Try these features as you play:
          </p>
          <ul
            className="text-left max-w-xs w-full mb-10 flex flex-col gap-2.5"
            style={{ color: 'var(--color-text)' }}
          >
            <li className="flex gap-3 text-sm">
              <span style={{ color: 'var(--color-text-strong)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>Tap <strong>? Guess category</strong> (top right) to earn +15 bonus coins</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span style={{ color: 'var(--color-text-strong)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>Open the <strong>hint shop</strong> via the Hints button at the bottom right</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span style={{ color: 'var(--color-text-strong)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>10 items in the bank — only 5 belong in the ranking. Not everything fits.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span style={{ color: 'var(--color-text-strong)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>When you're done, a new puzzle drops every day.</span>
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
            <strong>Hint shop</strong>: tap the hints button at the bottom right
          </p>
          <p className="text-xs" style={{ color: 'var(--color-bg)', opacity: 0.9 }}>
            Not all items are in the top 5, so you might not need to unlock them all!
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
          className="mb-5 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase"
          style={{ background: 'var(--color-text-strong)', color: 'var(--color-bg)' }}
        >
          TUTORIAL · GAME 1 OF 2
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--color-text-strong)' }}>
          Welcome to Reckon
        </h1>
        <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--color-text)' }}>
          There's a secret ranked list. Find what's on it and put the top 5 in order.
        </p>

        {/* Phone mockup */}
        <div className="mb-7 mx-auto" style={{ width: '140px' }}>
          <div
            className="rounded-[22px] overflow-hidden"
            style={{ border: '2.5px solid var(--color-text-strong)', background: 'var(--color-bg)' }}
          >
            {/* Status bar */}
            <div className="flex justify-center items-center pt-2 pb-1.5" style={{ background: 'var(--color-text-strong)' }}>
              <div className="rounded-full" style={{ width: '28px', height: '5px', background: 'var(--color-bg)', opacity: 0.35 }} />
            </div>
            {/* FIND zone */}
            <div className="px-2.5 py-2" style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-[7px] font-black tracking-widest uppercase mb-0.5" style={{ color: 'var(--color-text-faint)', opacity: 0.55 }}>Find</p>
              <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>Type items to discover them</p>
            </div>
            {/* History zone */}
            <div className="px-2.5 py-3 flex items-center justify-center" style={{ minHeight: '42px', borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-[8px] text-center" style={{ color: 'var(--color-text-faint)', opacity: 0.4 }}>attempts + feedback</p>
            </div>
            {/* RANK zone */}
            <div className="px-2.5 py-2" style={{ background: 'var(--color-bg-elevated)' }}>
              <p className="text-[7px] font-black tracking-widest uppercase mb-0.5" style={{ color: 'var(--color-text-faint)', opacity: 0.55 }}>Rank</p>
              <p className="text-[9px]" style={{ color: 'var(--color-text-faint)' }}>Order top 5, then submit</p>
            </div>
            {/* Home bar */}
            <div className="flex justify-center py-1.5" style={{ background: 'var(--color-bg)' }}>
              <div className="rounded-full" style={{ width: '32px', height: '3px', background: 'var(--color-border)' }} />
            </div>
          </div>
        </div>

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
      label: 'Step 1 of 3: Find the items',
      instruction: "Type a name into the search box and hit Guess. If it's on the list, it appears below.",
      progress: `Found ${discoveredCount} / ${NEEDED} needed`,
    },
    2: {
      label: 'Step 2 of 3: Build a ranking',
      instruction: "Tap a found item to fill a slot. Try a wrong order first. It's the best way to see how feedback works.",
      progress: null,
    },
    3: submitted ? {
      label: 'Step 3 of 3: Read your feedback',
      instruction: '● = right item, right spot · ○ = right item, wrong spot · no dot = not in the top 5. Adjust and submit again.',
      progress: null,
    } : {
      label: 'Step 3 of 3: Submit your ranking',
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
