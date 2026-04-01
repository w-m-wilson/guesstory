# AGENT BRIEF — Rankie
> Read this fully before touching any code. This is the source of truth for the game, the stack, and the current implementation.

---

## What This Is

A **daily mobile-first web game** combining trivia-based inference with rank-ordering, built in React + Vite, hosted on Vercel. Think Wordle crossed with Mastermind crossed with "name the top 10." The game is authored by one person (the developer), runs from static JSON puzzle files, and has no backend or auth.

---

## Game Mechanics

### The Core Loop

Each puzzle has:
- A **hidden ranked list** of 8–10 real-world items (e.g., "Top 10 most-followed accounts on Instagram")
- A **hidden category label** the player can guess for a coin bonus
- **Seed items** pre-revealed by the puzzle author (e.g., "Cristiano Ronaldo is #3")

Two concurrent tracks:

---

### Track 1: The Bank

**Goal:** Discover which items are in the list via free-text guesses.

- Fuzzy-matched against each item's `name` + `aliases` array (Fuse.js)
- Thresholds (in `src/config.js`):
  - `bankThreshold: 0.25` — max Fuse score to count as a match
  - `bankConfidentThreshold: 0.08` — below this score → auto-accept; above → ask "Did you mean X?"
- Bank miss costs: **3 free misses**, then **1 coin per miss** after that
- Correct guesses are always free

---

### Track 2: The Ranking

**Goal:** Submit the correct top 5 items in the correct order.

- Player places discovered bank items into 5 numbered slots
- On submission, receives **Mastermind-style feedback** per slot:
  - `correct` → item is in the top 5 AND in the right position
  - `present` → item is in the top 5 but in the wrong position
  - `absent`  → item is NOT in the top 5
  - `empty`   → slot was left blank
- **Cost per wrong submission: 1 coin × number of `absent` slots** (items placed outside the top 5)
  - All-top-5 guesses in wrong order → 0 coins
  - 2 non-top-5 items → 2 coins
  - Max cost per submission = 5 coins
- Win condition: all 5 slots return `correct`
- Game is abandoned when coins reach 0 after a submission

**Locked slots:** Purchasing the "Reveal rank position" hint pins one item into its correct slot permanently (until reset). Locked slots survive wrong submissions and cannot be removed by the player.

---

### The Category

- Hidden at game start; player can guess via the header input
- Matching uses a **two-pass** strategy (see `src/utils/matcher.js`):
  1. Fuse.js whole-string match (handles typos, order-sensitive)
  2. Per-word Fuse match (handles reordered phrases like "instagram followers" ↔ "Most followed accounts on Instagram")
  - Threshold per word: 0.35; requires ≥60% of query words to hit
- Correct guess: **+15 coins** (configurable: `category.correctGuessBonus`)
- Wrong guess costs: **2 free misses**, then **1 coin per miss**
- Can also be revealed via hint for 25 coins (no coin bonus in that case)

---

### Currency & Scoring

- Every game starts with **100 coins** (`startingCoins`)
- Coins are spent on misses, hints, and rank submissions; never on correct guesses
- Final score = coins remaining at end of game
- Grade thresholds (EndScreen):
  - 100 = Perfect, 85+ = Excellent, 70+ = Great, 50+ = Good, else = Keep practicing

**Hint shop costs (all in `src/config.js`):**
| Hint | Cost |
|------|------|
| Reveal category | 25 coins |
| Reveal one bank item | 20 coins |
| Pin a rank position | 50 coins |

---

## Input & Matching

- All guesses are **free text** (no dropdowns, no autocomplete)
- Bank matching: Fuse.js against `[name, ...aliases]` per item; `ignoreLocation: true`
- Category matching: two-pass (see above)
- Case-insensitive, trims whitespace
- "Did you mean X?" confirmation shown when score is between `bankConfidentThreshold` and `bankThreshold`

---

## Puzzle Data Format

Puzzles live in `src/data/puzzles/` as `YYYY-MM-DD.json`, loaded by `src/hooks/usePuzzle.js` via dynamic import keyed to today's date.

```json
{
  "id": "2026-04-01",
  "category": "Most followed accounts on Instagram",
  "seed": [
    { "rank": 3, "name": "Cristiano Ronaldo", "aliases": ["CR7", "Ronaldo", "cristiano"] }
  ],
  "bank": [
    { "rank": 1,  "name": "Instagram",        "aliases": ["instagram official", "ig"] },
    { "rank": 2,  "name": "Lionel Messi",     "aliases": ["Messi", "Leo Messi", "leo"] },
    { "rank": 3,  "name": "Cristiano Ronaldo","aliases": ["CR7", "Ronaldo", "cristiano"] },
    { "rank": 4,  "name": "Selena Gomez",     "aliases": ["Selena", "selenagomez"] },
    { "rank": 5,  "name": "Kylie Jenner",     "aliases": ["Kylie"] },
    { "rank": 6,  "name": "Dwayne Johnson",   "aliases": ["The Rock", "rock", "dwayne"] },
    { "rank": 7,  "name": "Ariana Grande",    "aliases": ["Ari", "ariana"] },
    { "rank": 8,  "name": "Kim Kardashian",   "aliases": ["Kim K", "kim"] },
    { "rank": 9,  "name": "Beyoncé",          "aliases": ["Bey", "Queen Bey", "beyonce"] },
    { "rank": 10, "name": "Khloe Kardashian", "aliases": ["Khloe K", "khloe"] }
  ],
  "topFive": [1, 2, 3, 4, 5]
}
```

- `seed` — items shown to the player at game start (subset of bank)
- `bank` — all items with absolute ranks and alias lists
- `topFive` — array of ranks that constitute the ranking challenge (currently always `[1,2,3,4,5]`)

---

## Project Structure

```
ranked/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── BankPanel.jsx       # Guess input, free-miss indicators, discovered item chips
│   │   ├── ConfirmMatch.jsx    # "Did you mean X?" prompt (inline in BankPanel)
│   │   ├── EndScreen.jsx       # Score summary + share card (dismissable overlay)
│   │   ├── GuessHistory.jsx    # Vertical list of past ranking attempts with Mastermind dots
│   │   ├── Header.jsx          # Rankie wordmark, ? button, category guess/reveal
│   │   ├── HintModal.jsx       # Hint shop bottom-sheet overlay
│   │   ├── IntroModal.jsx      # How-to-play splash (auto-shown on first visit)
│   │   ├── RankBoard.jsx       # 5 slots, double-click to remove, locked-slot support
│   │   └── ScoreBar.jsx        # Coin count (pulse + float animations), Reset, Hints
│   ├── data/
│   │   └── puzzles/
│   │       └── 2026-04-01.json
│   ├── hooks/
│   │   ├── useGameState.js     # Core state machine (useReducer + localStorage)
│   │   └── usePuzzle.js        # Dynamic import of today's puzzle JSON by date
│   ├── utils/
│   │   ├── itemKeys.js         # Generates unique 2-letter keys per item (LM, CR, IN…)
│   │   ├── mastermind.js       # generateFeedback() → correct/present/absent/empty
│   │   ├── matcher.js          # createBankMatcher() + matchCategory() (Fuse.js)
│   │   └── scoring.js          # getBankMissCost(), getCategoryMissCost(), getHintCost()
│   ├── App.jsx                 # Puzzle gate, intro modal state, first-visit localStorage flag
│   ├── GameScreen.jsx          # Layout shell, owns useGameState, wires all children
│   ├── index.css               # Tailwind v4, Solarized palette, animation keyframes
│   └── main.jsx
├── agent.md                    # This file — source of truth for game design
├── index.html
├── package.json
└── vite.config.js
```

---

## State Shape (`useGameState`)

```js
{
  coins: 100,
  bankMisses: 0,          // total bank misses (used to determine free vs paid)
  categoryMisses: 0,
  discoveredItems: {},    // { [rank]: item } — known bank items
  rankSlots: [null, null, null, null, null],  // current ranking attempt (index 0 = position 1)
  lockedSlots: [],        // slot indices locked by revealRankPosition hint
  rankHistory: [],        // [{ slots: [...], feedback: [...] }] — all past submissions
  categoryGuessed: false,
  gameStatus: 'playing',  // 'playing' | 'won' | 'abandoned'
  pendingMatch: null,     // { item, query } | null — awaiting "Did you mean?" confirmation
}
```

State persists to `localStorage` keyed by puzzle ID. New fields default from `initState()` via merge on load (prevents blank-screen crashes when state shape evolves).

---

## UI Layout

```
┌─────────────────────────────┐
│ Rankie ?   [Guess category] │  ← Header (? opens how-to-play; category guess expands row)
├─────────────────────────────┤
│ [Guess a name…]  [Guess]    │  ← BankPanel — guess input, free-miss dots
│ Free misses: ● ● ○           │
│                             │
│ [Instagram] [Lionel Messi]  │  ← Discovered item chips (tap to place)
│ [★ Cristiano Ronaldo]       │
├─────────────────────────────┤
│ #1  IN LM SG CR KJ  ● ○    │  ← GuessHistory — vertical rows, spoiler-free dots right
│ #2  LM CR IN SG KJ  ●●●    │
├─────────────────────────────┤
│ Attempt 3                   │  ← RankBoard — 5 slots
│ 1. ─────────────────────    │    Double-click a filled slot to remove
│ 2. Lionel Messi             │    ★ = locked (pinned by hint)
│ 3. ★ Cristiano Ronaldo      │
│ 4. ─────────────────────    │
│ 5. ─────────────────────    │
│ [ Submit Ranking ]          │
├─────────────────────────────┤
│ 🪙 82        ↺ Reset  Hints │  ← ScoreBar — coin pulses + floats on change
└─────────────────────────────┘
```

- Tap-to-place: tap a chip → fills next empty (non-locked) slot
- Double-click/tap a filled slot to clear it (locked slots are immune)
- End screen overlay: dismissable by clicking the backdrop; reopens on next game end

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind v4 (`@tailwindcss/vite` plugin, no PostCSS config) |
| Theme | Solarized — semantic CSS vars, `prefers-color-scheme` dark/light |
| Fuzzy match | Fuse.js |
| State | `useReducer` + `localStorage` (no backend) |
| Hosting | Vercel (static, zero-config) |

---

## Config Reference (`src/config.js`)

All tunable game parameters live here. Change these, not the components.

```js
{
  startingCoins: 100,
  bank:     { freeMisses: 3, missCost: 1 },
  category: { freeMisses: 2, missCost: 1, correctGuessBonus: 15 },
  ranking:  { absentCost: 1 },   // coins per absent item in a wrong submission
  hints:    { revealCategory: 25, revealBankItem: 20, revealRankPosition: 50 },
  matcher:  { bankThreshold: 0.25, bankConfidentThreshold: 0.08, categoryThreshold: 0.35 },
}
```

---

## Key Implementation Notes

- **`stateRef` pattern**: `stateRef.current = state` on every render so `useCallback` handlers read current state without stale closures and without bloated dependency arrays.
- **State migration**: saved state is merged over `initState(puzzle)` on load so newly added fields (e.g. `lockedSlots`) always have defaults — prevents blank-screen crashes.
- **Mastermind feedback**: `generateFeedback(slots)` in `mastermind.js` compares each slot's item rank against `expectedRank = index + 1`. Assumes `topFive = [1,2,3,4,5]`.
- **2-letter item keys**: `buildItemKeys(bankItems)` in `itemKeys.js` generates collision-free 2-letter codes (LM, CR, IN…) used in GuessHistory rows.
- **Category matching**: two-pass — Fuse whole-string first, then per-word Fuse (threshold 0.35) to handle morphological variants ("followers" ↔ "followed") and reordering.
