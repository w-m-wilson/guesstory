# AGENT BRIEF — Guesstory
> Read this fully before touching any code. This is the source of truth for the game, the stack, and the current implementation.

---

## What This Is

A **daily mobile-first web game** combining trivia-based inference with rank-ordering, built in React + Vite, hosted on Vercel. Think Wordle crossed with Mastermind crossed with "name the top 10." The game is authored by one person (the developer), runs from static JSON puzzle files, and uses Vercel Functions backed by Claude Haiku for AI-powered features (category checking, hint nudges, game recap).

---

## Game Mechanics

### The Core Loop

Each puzzle has:
- A **hidden ranked list** of 8–10 real-world items (e.g., "Top 10 most-followed accounts on Instagram")
- A **hidden category label** the player can guess for a coin bonus
- **Seed items** pre-revealed by the puzzle author (quantity depends on difficulty tier)

Two concurrent tracks:

---

### Track 1: The Bank

**Goal:** Discover which items are in the list via free-text guesses.

- Fuzzy-matched against each item's `name` + `aliases` array (Fuse.js)
- Thresholds (in `src/config.js`):
  - `bankThreshold: 0.25` — max Fuse score to count as a match
  - `bankConfidentThreshold: 0.08` — below this score → auto-accept; above → ask "Did you mean X?"
- Bank miss costs vary by difficulty (see Difficulty section below)
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
- **Cost per wrong submission: N coins × number of `absent` slots** (N depends on difficulty)
  - All-top-5 guesses in wrong order → 0 coins
  - Max cost per submission = 5 × absentCost
- Win condition: all 5 slots return `correct`
- Game is abandoned when coins reach 0 after a submission
- **Hail Mary**: one free ranking attempt is granted after going abandoned (`hailMaryTaken` flag)

**Locked slots:** Purchasing the "Reveal rank position" hint pins one item into its correct slot permanently (until reset). Locked slots survive wrong submissions and cannot be moved by the player.

**Lite auto-lock:** In Lite mode, correct slots are automatically locked after each submission.

---

### The Category

- Hidden at game start; player can guess via the header input
- Matching uses the Claude Haiku API (`/api/check-category`) with local Fuse.js fallback
- LLM returns `matched | warm | cold` verdict plus a short hint
- Local fallback uses a **two-pass** strategy (see `src/utils/matcher.js`):
  1. Fuse.js whole-string match (handles typos, order-sensitive)
  2. Per-word Fuse match (handles reordered phrases like "instagram followers" ↔ "Most followed accounts on Instagram")
  - Threshold per word: 0.15; requires ≥60% of query words to hit
- Correct guess: **+15 coins** (all difficulties)
- Wrong guess costs and free misses vary by difficulty (see below)
- Can also be revealed via hint for 40–60 coins (no coin bonus in that case)
- Some puzzles auto-reveal the category for certain difficulty tiers via `revealCategoryFor` in puzzle data

---

### Currency & Scoring

- Every game starts with **100 coins** (`startingCoins`)
- Coins are spent on misses, hints, and rank submissions; never on correct guesses
- Final score = coins remaining at end of game
- Grade thresholds (EndScreen):
  - 100 = Perfect, 85+ = Excellent, 70+ = Great, 50+ = Good, else = Keep practicing

---

## Difficulty

Three tiers: `lite`, `medium` (default), `challenge`. Chosen once before the first guess; can be downgraded mid-game but not upgraded.

| Parameter | Lite | Medium | Challenge |
|-----------|------|--------|-----------|
| Bank miss cost | 0 | 1 | 2 |
| Bank free misses | 3 | 3 | 3 |
| Category miss cost | 2 | 5 | 8 |
| Category free misses | 3 | 3 | 3 |
| Absent slot cost | 0 | 1 | 2 |
| Seed items | Most (`liteSeed` ∪ `seed` ∪ `challengeSeed`) | Some (`seed` ∪ `challengeSeed`) | Fewest (`challengeSeed`) |

**Hint shop costs by difficulty:**

| Hint | Lite | Medium | Challenge |
|------|------|--------|-----------|
| Reveal bank item | 5 | 5 | 8 |
| Pin known rank position | 10 | 10 | 15 |
| Category nudge clue | 10 | 10 | 15 |
| Pin unknown rank position | 30 | 30 | 45 |
| Reveal category | 40 | 40 | 60 |

---

## Input & Matching

- All guesses are **free text** (no dropdowns, no autocomplete)
- Bank matching: Fuse.js against `[name, ...aliases]` per item; `ignoreLocation: true`
- Category matching: Claude Haiku API with local two-pass Fuse fallback (see above)
- Case-insensitive, trims whitespace
- "Did you mean X?" confirmation shown when score is between `bankConfidentThreshold` and `bankThreshold`
- BankPanel also detects category-format guesses (phrases containing ranking/metric words) and redirects them to the category input

---

## Puzzle Data Format

Puzzles live in `src/data/puzzles/` as `YYYY-MM-DD.json`, loaded by `src/hooks/usePuzzle.js` via dynamic import keyed to today's date.

```json
{
  "id": "2026-04-01",
  "category": "Most followed accounts on Instagram",
  "hint": "Think social media royalty",
  "source": "https://example.com/source-url",
  "challengeSeed": [
    { "rank": 3, "name": "Cristiano Ronaldo", "aliases": ["CR7", "Ronaldo", "cristiano"] }
  ],
  "seed": [
    { "rank": 3, "name": "Cristiano Ronaldo", "aliases": ["CR7", "Ronaldo", "cristiano"] },
    { "rank": 7, "name": "Ariana Grande",     "aliases": ["Ari", "ariana"] }
  ],
  "liteSeed": [
    { "rank": 3,  "name": "Cristiano Ronaldo", "aliases": ["CR7", "Ronaldo", "cristiano"] },
    { "rank": 7,  "name": "Ariana Grande",     "aliases": ["Ari", "ariana"] },
    { "rank": 9,  "name": "Beyoncé",           "aliases": ["Bey", "Queen Bey", "beyonce"] }
  ],
  "bank": [
    { "rank": 1,  "name": "Instagram",         "aliases": ["instagram official", "ig"] },
    { "rank": 2,  "name": "Lionel Messi",      "aliases": ["Messi", "Leo Messi", "leo"] },
    { "rank": 3,  "name": "Cristiano Ronaldo", "aliases": ["CR7", "Ronaldo", "cristiano"] },
    { "rank": 4,  "name": "Selena Gomez",      "aliases": ["Selena", "selenagomez"] },
    { "rank": 5,  "name": "Kylie Jenner",      "aliases": ["Kylie"] },
    { "rank": 6,  "name": "Dwayne Johnson",    "aliases": ["The Rock", "rock", "dwayne"] },
    { "rank": 7,  "name": "Ariana Grande",     "aliases": ["Ari", "ariana"] },
    { "rank": 8,  "name": "Kim Kardashian",    "aliases": ["Kim K", "kim"] },
    { "rank": 9,  "name": "Beyoncé",           "aliases": ["Bey", "Queen Bey", "beyonce"] },
    { "rank": 10, "name": "Khloe Kardashian",  "aliases": ["Khloe K", "khloe"] }
  ],
  "topFive": [1, 2, 3, 4, 5],
  "revealCategoryFor": ["lite"]
}
```

**Field reference:**
- `id` — ISO date string; used as localStorage key and puzzle identifier
- `category` — the hidden category label players are trying to guess
- `hint` — short hint shown in the category guess area (always visible)
- `source` — optional URL shown as "source" link on the EndScreen
- `challengeSeed` — items pre-revealed in Challenge (and all easier) modes
- `seed` — items pre-revealed in Medium (and Lite) mode; should be a superset of `challengeSeed`
- `liteSeed` — items pre-revealed in Lite mode only; should be a superset of `seed`
- `bank` — all items with absolute ranks and alias lists
- `topFive` — array of ranks that constitute the ranking challenge (currently always `[1,2,3,4,5]`)
- `revealCategoryFor` — optional array of difficulty strings where the category is auto-revealed at game start (e.g. `["lite"]`)

Seeds are cumulative: `challengeSeed ⊆ seed ⊆ liteSeed`.

---

## Project Structure

```
ranked/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BankPanel.jsx        # Guess input, free-miss indicators, discovered item chips
│   │   ├── ConfirmMatch.jsx     # "Did you mean X?" inline prompt
│   │   ├── EndScreen.jsx        # Score summary, AI recap, share card, post-win category guess
│   │   ├── FeedbackDots.jsx     # Mastermind dot renderer (● ○ —), spoiler-free mode support
│   │   ├── GuessHistory.jsx     # Vertical list of past ranking attempts with Mastermind dots
│   │   ├── Header.jsx           # Guesstory wordmark, ? / settings buttons, category guess/reveal
│   │   ├── HintModal.jsx        # Hint shop bottom-sheet overlay (5 hint types)
│   │   ├── IntroModal.jsx       # How-to-play splash (auto-shown on first visit)
│   │   ├── RankBoard.jsx        # 5 slots, drag-to-reorder, locked-slot support
│   │   ├── ScoreBar.jsx         # Coin count (pulse + float animations), difficulty badge, Reset, Hints
│   │   ├── SettingsModal.jsx    # Theme (light/dark/system) + color scheme picker
│   │   └── TutorialBanner.jsx   # Step-by-step in-game tutorial overlays
│   ├── data/
│   │   ├── tutorialPuzzle.js    # Static puzzle data for the 2-game tutorial flow
│   │   └── puzzles/
│   │       └── YYYY-MM-DD.json  # Daily puzzle files
│   ├── hooks/
│   │   ├── useAppearance.js     # Theme (light/dark/system) + color scheme; syncs to localStorage + DOM
│   │   ├── useGameState.js      # Core state machine (useReducer + localStorage)
│   │   └── usePuzzle.js         # Dynamic import of today's puzzle JSON by date
│   ├── utils/
│   │   ├── itemKeys.js          # Generates unique 2-letter keys per item (LM, CR, IN…)
│   │   ├── mastermind.js        # generateFeedback() → correct/present/absent/empty
│   │   ├── matcher.js           # createBankMatcher() + matchCategory() (Fuse.js)
│   │   └── scoring.js           # getBankMissCost(), getCategoryMissCost(), getHintCost()
│   ├── App.jsx                  # Tutorial flow, daily puzzle gate, intro/settings modal state
│   ├── GameScreen.jsx           # Layout shell, owns useGameState, wires all children
│   ├── config.js                # All tunable game parameters (costs, thresholds, hint prices)
│   ├── index.css                # Tailwind v4, 4 color schemes × light/dark, animation keyframes
│   └── main.jsx                 # Entry point — React root, Vercel Analytics, context menu disable
├── api/
│   ├── check-category.js        # POST — LLM category verdict (matched/warm/cold + hint text)
│   ├── category-nudge.js        # POST — LLM cryptic/oblique clue for category hint
│   ├── game-recap.js            # POST — LLM 1–2 sentence witty game recap (cached in localStorage)
│   ├── hint-bank-guess.js       # POST — LLM feedback on failed bank guesses
│   └── narrate-attempt.js       # POST — LLM attempt narration (disabled in production)
├── agent.md                     # This file — source of truth for game design
├── index.html
├── package.json
└── vite.config.js
```

---

## State Shape (`useGameState`)

```js
{
  coins: 100,
  difficulty: 'medium',        // 'lite' | 'medium' | 'challenge'
  bankMisses: 0,               // total bank misses (determines free vs paid)
  categoryMisses: 0,
  discoveredItems: {},         // { [rank]: item } — known bank items
  rankSlots: [null, null, null, null, null],  // current ranking attempt (index 0 = position 1)
  lockedSlots: [],             // slot indices locked by hints or Lite auto-lock
  confirmedCorrect: [],        // [{ index, item }] — Lite mode: slots confirmed correct after submit
  rankHistory: [],             // [{ slots: [...], feedback: [...] }] — all past submissions
  categoryGuessed: false,
  gameStatus: 'playing',       // 'playing' | 'won' | 'abandoned'
  pendingMatch: null,          // { item, query } | null — awaiting "Did you mean?" confirmation
  hailMaryTaken: false,        // one free ranking attempt granted after abandonment
}
```

State persists to `localStorage` keyed by puzzle ID (`guesstory-state-{puzzleId}`). New fields default from `initState()` via merge on load (prevents blank-screen crashes when state shape evolves).

**Other localStorage keys:**
- `guesstory-difficulty` — persisted difficulty choice across sessions
- `guesstory-appearance` — persisted theme and color scheme
- `guesstory-intro-seen` — whether the intro modal has been shown
- `guesstory-tutorial-v2` — whether the tutorial has been completed
- `recap-{puzzleId}` — cached AI recap text per puzzle

---

## UI Layout

```
┌─────────────────────────────┐
│ Guesstory ?⚙  [Guess category] │  ← Header (? = how-to-play, ⚙ = settings; category guess expands row)
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
│ Attempt 3                   │  ← RankBoard — 5 slots, drag-to-reorder
│ 1. ─────────────────────    │    Tap a filled slot to remove (locked slots immune)
│ 2. Lionel Messi             │    ★ = locked (pinned by hint or Lite auto-lock)
│ 3. ★ Cristiano Ronaldo      │
│ 4. ─────────────────────    │
│ 5. ─────────────────────    │
│ [ Submit Ranking ]          │
├─────────────────────────────┤
│ 🪙 82  Medium  ↺ Reset  Hints│  ← ScoreBar — coin pulses + floats on change
└─────────────────────────────┘
```

- Tap-to-place: tap a chip → fills next empty (non-locked) slot
- Tap a filled slot to clear it (locked slots are immune)
- RankBoard supports drag-to-reorder via pointer events
- End screen overlay: dismissable by clicking the backdrop; reopens on next game end
- Post-win bonus: if category wasn't guessed, EndScreen prompts one free category guess before showing the recap

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind v4 (`@tailwindcss/vite` plugin, no PostCSS config) |
| Themes | 4 color schemes (Gruvbox, Solarized, Minimal, Bailly) × light/dark/system |
| Fuzzy match | Fuse.js |
| State | `useReducer` + `localStorage` (no database) |
| AI | Claude Haiku 4.5 via Vercel Functions (category check, nudge, recap, hint feedback) |
| Analytics | Vercel Analytics |
| Hosting | Vercel |

---

## Config Reference (`src/config.js`)

All tunable game parameters live here. Change these, not the components.

```js
// GAME_CONFIG — difficulty-independent
{
  startingCoins: 100,
  matcher: {
    bankThreshold: 0.25,            // max Fuse score to count as a bank match
    bankConfidentThreshold: 0.08,   // below this → auto-accept (no confirmation)
    categoryThreshold: 0.15,        // per-word threshold for local category fallback
  },
}

// DIFFICULTY_CONFIG — keyed by 'lite' | 'medium' | 'challenge'
{
  lite: {
    bank:     { freeMisses: 3, missCost: 0 },
    category: { freeMisses: 3, missCost: 2,  correctGuessBonus: 15 },
    ranking:  { absentCost: 0 },
    hints: {
      revealBankItem: 5,
      revealRankPositionKnown: 10,
      revealCategoryNudge: 10,
      revealRankPositionUnknown: 30,
      revealCategory: 40,
    },
  },
  medium: {
    bank:     { freeMisses: 3, missCost: 1 },
    category: { freeMisses: 3, missCost: 5,  correctGuessBonus: 15 },
    ranking:  { absentCost: 1 },
    hints: {
      revealBankItem: 5,
      revealRankPositionKnown: 10,
      revealCategoryNudge: 10,
      revealRankPositionUnknown: 30,
      revealCategory: 40,
    },
  },
  challenge: {
    bank:     { freeMisses: 3, missCost: 2 },
    category: { freeMisses: 3, missCost: 8,  correctGuessBonus: 15 },
    ranking:  { absentCost: 2 },
    hints: {
      revealBankItem: 8,
      revealRankPositionKnown: 15,
      revealCategoryNudge: 15,
      revealRankPositionUnknown: 45,
      revealCategory: 60,
    },
  },
}
```

---

## Key Implementation Notes

- **`stateRef` pattern**: `stateRef.current = state` on every render so `useCallback` handlers read current state without stale closures and without bloated dependency arrays.
- **State migration**: saved state is merged over `initState(puzzle)` on load so newly added fields always have defaults — prevents blank-screen crashes.
- **Seed hierarchy**: seeds are cumulative (`challengeSeed ⊆ seed ⊆ liteSeed`). `seedsForDifficulty()` merges the appropriate tiers by rank using a Map, so harder-tier items are never dropped when the player downgrades.
- **Mastermind feedback**: `generateFeedback(slots)` in `mastermind.js` compares each slot's item rank against `expectedRank = index + 1`. Assumes `topFive = [1,2,3,4,5]`.
- **2-letter item keys**: `buildItemKeys(bankItems)` in `itemKeys.js` generates collision-free 2-letter codes (LM, CR, IN…) used in GuessHistory rows.
- **Category matching**: Claude Haiku API first, local two-pass Fuse fallback if unavailable. Local pass 1: whole-string Fuse; pass 2: per-word Fuse (threshold 0.15) handles morphological variants ("followers" ↔ "followed") and reordering.
- **Tutorial flow**: 2-game tutorial in `App.jsx` — game 1 (learn mode: bank + ranking basics), game 2 (explore mode: hints + category). Tutorial state is separate from daily puzzle state.
- **AI endpoints**: all 5 Vercel Functions use Claude Haiku 4.5. `narrate-attempt` is implemented but disabled in production (commented out in `GameScreen.jsx`).
