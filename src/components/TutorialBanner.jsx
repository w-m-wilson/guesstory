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
            style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
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
            style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
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
        style={{ background: 'var(--color-action)', borderBottom: '1px solid var(--color-border)' }}
      >
        <p
          className="text-xs font-black uppercase tracking-widest mb-1.5"
          style={{ color: 'var(--color-action-text)', opacity: 0.65 }}
        >
          TUTORIAL · GAME 2 OF 2
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-xs" style={{ color: 'var(--color-action-text)', opacity: 0.9 }}>
            <strong>Guess category</strong> (top right) for +15 bonus coins
          </p>
          <p className="text-xs" style={{ color: 'var(--color-action-text)', opacity: 0.9 }}>
            <strong>Hint shop</strong>: tap the hints button at the bottom right
          </p>
          <p className="text-xs" style={{ color: 'var(--color-action-text)', opacity: 0.9 }}>
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
          style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
        >
          TUTORIAL · GAME 1 OF 2
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--color-text-strong)' }}>
          Welcome to Guesstory
        </h1>
        <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--color-text)' }}>
          There's a secret ranked list. Find what's on it and put the top 5 in order.
        </p>

        {/* Phone mockup — modern flat slab */}
        <div className="mb-7 mx-auto relative" style={{ width: '180px' }}>
          {/* Volume buttons (left) */}
          <div className="absolute rounded-l-sm" style={{ left: '-4px', top: '68px',  width: '3px', height: '22px', background: 'var(--color-action)' }} />
          <div className="absolute rounded-l-sm" style={{ left: '-4px', top: '98px',  width: '3px', height: '36px', background: 'var(--color-action)' }} />
          {/* Power button (right) */}
          <div className="absolute rounded-r-sm" style={{ right: '-4px', top: '88px', width: '3px', height: '44px', background: 'var(--color-action)' }} />

          <div
            className="rounded-[28px] overflow-hidden flex flex-col"
            style={{
              border: '3px solid var(--color-action)',
              background: 'var(--color-bg)',
              minHeight: '340px',
            }}
          >
            {/* Status bar with punch-hole camera */}
            <div className="flex items-center justify-between px-4 pt-2 pb-1" style={{ background: 'var(--color-bg)' }}>
              <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--color-text-faint)', opacity: 0.5 }}>9:41</span>
              <div className="rounded-full" style={{ width: '8px', height: '8px', background: 'var(--color-action)', opacity: 0.6 }} />
              <div className="flex items-center gap-0.5" style={{ opacity: 0.5 }}>
                <div className="rounded-sm" style={{ width: '10px', height: '5px', border: '1px solid var(--color-text-faint)' }}>
                  <div className="rounded-sm" style={{ width: '6px', height: '3px', background: 'var(--color-text-faint)', margin: '1px 1px' }} />
                </div>
              </div>
            </div>

            {/* FIND zone */}
            <div className="px-4 py-3" style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--color-text)' }}>Find</p>
              <p className="text-sm font-bold leading-snug" style={{ color: 'var(--color-text-strong)' }}>Type items to discover them</p>
            </div>

            {/* History zone */}
            <div className="flex-1 px-4 py-5 flex items-center justify-center" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-xs font-semibold text-center" style={{ color: 'var(--color-text)' }}>attempts + feedback</p>
            </div>

            {/* RANK zone */}
            <div className="px-4 py-3" style={{ background: 'var(--color-bg-elevated)' }}>
              <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--color-text)' }}>Rank</p>
              <p className="text-sm font-bold leading-snug" style={{ color: 'var(--color-text-strong)' }}>Order top 5, then submit</p>
            </div>

            {/* Gesture bar */}
            <div className="flex justify-center py-2" style={{ background: 'var(--color-bg)' }}>
              <div className="rounded-full" style={{ width: '36px', height: '3px', background: 'var(--color-text-faint)', opacity: 0.3 }} />
            </div>
          </div>
        </div>

        <button
          onClick={onBegin}
          className="w-full max-w-xs py-3.5 rounded-xl text-base font-bold"
          style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
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
      instruction: 'Tap a found item to fill a slot. You can try a rough order first — each submit adds a row with feedback dots on the right.',
      progress: null,
    },
    3: submitted ? {
      label: 'Step 3 of 3: Refine your ranking',
      instruction: "Use the dots as a compass, then adjust and submit again. After the tutorial, your first daily puzzle will open a full guide to what they mean.",
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
      style={{ background: 'var(--color-action)', borderBottom: '1px solid var(--color-border)' }}
    >
      <p
        className="text-xs font-black uppercase tracking-widest mb-1"
        style={{ color: 'var(--color-action-text)', opacity: 0.65 }}
      >
        TUTORIAL · GAME 1 OF 2
      </p>
      <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--color-action-text)' }}>
        {label}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-action-text)', opacity: 0.85 }}>
        {instruction}
      </p>
      {progress && (
        <p className="text-xs mt-1.5 font-semibold" style={{ color: 'var(--color-action-text)', opacity: 0.7 }}>
          {progress}
        </p>
      )}
    </div>
  )
}
