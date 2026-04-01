# AGENT BRIEF — Ranked (Working Title)
> Read this fully before touching any code. This is the source of truth for the game, the stack, and current scope.

---

## What This Is

A **daily mobile-first web game** combining trivia-based inference with rank-ordering, built in React + Vite, hosted on Vercel. Think Wordle crossed with Mastermind crossed with "name the top 10." The game is authored by one person (the developer), runs from static JSON puzzle files, and has no backend or auth for now.

---

## Game Mechanics (Complete)

### The Core Loop

Each puzzle has:
- A **hidden ranked list** of 8–10 real-world items (e.g., "Top 10 most-followed accounts on Instagram")
- A **hidden category label** the player tries to infer
- **Starting conditions** pre-seeded by the puzzle author (e.g., "Cristiano Ronaldo is #3" or "These 3 are confirmed in the bank")

The player has two concurrent tracks running simultaneously:

---

### Track 1: The Bank

**Goal:** Discover which items belong in the top 8–10, regardless of order.

- Player submits free-text guesses ("Is Selena Gomez in the bank?")
- Game responds: ✓ (in bank), ✗ (not in bank), or already revealed
- Pre-seeded items are shown at game start
- Discovering all bank items is not required to play Track 2
- Bank guesses cost **5 coins** on a miss, **0 coins** on a hit

---

### Track 2: The Ranking

**Goal:** Submit the correct top 5 items in the correct order.

- Player selects 5 items from discovered bank items and arranges them 1–5
- On submission, receives **Mastermind-style feedback**:
  - 🔴 Filled circle = correct item, correct position
  - ⚪ Open circle = correct item, wrong position
  - ✗ or blank = item not in top 5
- Example feedback: `● ● ○ ○ ✗` means 2 right-place, 2 wrong-place, 1 not in top 5
- Each ranking submission costs **10 coins** on a full miss, scaled per incorrect slot (TBD exact formula — placeholder: 2 coins per wrong slot)
- Player can return to Bank between ranking attempts

---

### The Category

- The category label is **hidden at game start**
- Player can guess the category via free text at any time
- Correct category guess: **no cost, unlocks a bonus bank guess or hint**
- Category costs **25 coins** to reveal via hint

---

### Currency & Scoring

- Every game starts with **100 coins**
- Coins are spent on misses and hints; never on correct guesses
- Final score = coins remaining at end of game
- Target: 100 = perfect, 85+ = excellent, grades scale down from there
- Score is displayed at end with a shareable summary (à la Wordle)

**Hint shop (costs coins):**
| Hint | Cost |
|------|------|
| Reveal category | 25 |
| Reveal one bank item | 20 |
| Reveal one rank position | 50 |

---

### Win Condition

Game ends when:
- Player correctly submits the top 5 in correct order, **OR**
- Player chooses to end (partial score recorded)

---

## Input & Matching

- All guesses are **free text** (no dropdowns, no autocomplete for now)
- Matching uses **Fuse.js** (fuzzy string matching) against a canonical alias list per puzzle item
- Each puzzle item has a curated alias array (e.g., `["JP2", "John Paul II", "Pope John Paul 2"]`)
- No LLM for MVP — add later if fuzzy matching proves insufficient
- Matching should be case-insensitive and trim whitespace

---

## Puzzle Data Format

Puzzles live in `/src/data/puzzles/` as individual JSON files, one per day.

```json
{
  "id": "2025-06-01",
  "category": "Most followed Instagram accounts",
  "seed": [
    { "rank": 3, "name": "Cristiano Ronaldo", "aliases": ["CR7", "Ronaldo", "cristiano"] }
  ],
  "bank": [
    { "rank": 1, "name": "Instagram", "aliases": ["instagram official", "instagram account"] },
    { "rank": 2, "name": "Lionel Messi", "aliases": ["Messi", "Leo Messi"] },
    { "rank": 3, "name": "Cristiano Ronaldo", "aliases": ["CR7", "Ronaldo", "cristiano"] },
    { "rank": 4, "name": "Selena Gomez", "aliases": ["Selena", "selenagomez"] },
    { "rank": 5, "name": "Kylie Jenner", "aliases": ["Kylie"] },
    { "rank": 6, "name": "Dwayne Johnson", "aliases": ["The Rock", "rock", "dwayne"] },
    { "rank": 7, "name": "Ariana Grande", "aliases": ["Ari", "ariana"] },
    { "rank": 8, "name": "Kim Kardashian", "aliases": ["Kim K", "kim"] },
    { "rank": 9, "name": "Beyoncé", "aliases": ["Bey", "Queen Bey", "beyonce"] },
    { "rank": 10, "name": "Khloe Kardashian", "aliases": ["Khloe K", "khloe"] }
  ],
  "topFive": [1, 2, 3, 4, 5]
}
```

- `seed` = items shown to player at game start (subset of bank)
- `bank` = all 8–10 items with ranks and aliases
- `topFive` = array of ranks that comprise the ranking challenge
- Add a `difficulty` field later if needed

---

## Project Structure

```
ranked/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── BankPanel.jsx          # Track 1 UI — discovered items list + guess input
│   │   ├── RankBoard.jsx          # Track 2 UI — 5 slots, tap-to-place, feedback circles
│   │   ├── ScoreBar.jsx           # Persistent bottom bar — coins, hint button, submit
│   │   ├── FeedbackDots.jsx       # Mastermind circle renderer
│   │   ├── GuessInput.jsx         # Shared free-text input modal/bottom sheet
│   │   ├── HintModal.jsx          # Hint shop overlay
│   │   └── EndScreen.jsx          # Score summary + share card
│   ├── data/
│   │   └── puzzles/
│   │       ├── 2025-06-01.json
│   │       └── 2025-06-02.json
│   ├── hooks/
│   │   ├── useGameState.js        # Core game state machine (coins, bank, ranks, guesses)
│   │   └── usePuzzle.js           # Loads today's puzzle by date
│   ├── utils/
│   │   ├── matcher.js             # Fuse.js wrapper — fuzzy match guess against alias lists
│   │   ├── scoring.js             # Coin deduction logic
│   │   └── mastermind.js          # Generates Mastermind feedback from a rank submission
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── AGENT_BRIEF.md                 # This file
```

---

## UI Layout (Mobile-First, Vertical)

Three persistent vertical zones — design for 390px wide (iPhone 14) as baseline:

```
┌─────────────────────────┐
│  BANK PANEL (scrollable)│  ← Collapsible; shows discovered items + tap to add to rank
│  [ + Guess ]            │
├─────────────────────────┤
│  RANK BOARD (fixed)     │  ← 5 numbered slots; tap bank item → fills next empty slot
│  1. ___  ●              │  ← Feedback dots appear inline after submission
│  2. ___  ○              │
│  3. ___  ●              │
│  4. ___                 │
│  5. ___                 │
│  [ Submit Ranking ]     │
├─────────────────────────┤
│  💰 82 coins  [Hints]   │  ← Always visible; hint button opens HintModal
└─────────────────────────┘
```

- Tap-to-place only (no drag-and-drop)
- Tap a filled rank slot to clear it
- GuessInput opens as a bottom sheet overlay
- All feedback is inline, no page transitions

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React + Vite | Fast dev, scalable, good ecosystem |
| Hosting | Vercel | Free tier, zero-config deploy from GitHub |
| Fuzzy match | Fuse.js | Best-in-class JS fuzzy search, no backend needed |
| State | React hooks + localStorage | No backend needed; persists today's game across refresh |
| Styling | CSS Modules or Tailwind (TBD) | Keep it simple for MVP |
| LLM (future) | Claude Haiku via Vercel serverless | Add only if Fuse.js proves insufficient |

---

## Current Scope (MVP — User Testing)

**In scope:**
- Single daily puzzle loaded by date
- Full game loop: bank guessing, rank submission, Mastermind feedback
- Coin scoring system
- Hint shop (at least category reveal)
- End screen with score
- localStorage game state persistence
- Mobile-first responsive layout

**Out of scope for MVP:**
- User accounts / leaderboards
- Puzzle authoring UI (author writes JSON directly)
- LLM interpretation
- Share card image generation (text-only share is fine)
- Multiple puzzles per day / archive

---

## Key Constraints & Gotchas

- **Matching must be forgiving.** Players will type partial names, nicknames, misspellings. Fuse.js threshold should be tuned permissively. When in doubt, accept the guess and ask for confirmation.
- **Coin costs are not final.** The formula may change based on playtesting. Keep all cost constants in `src/utils/scoring.js` so they're easy to tune.
- **State machine is the hard part.** `useGameState.js` is the core of the app. It needs to handle: bank guesses (hit/miss), rank submissions (with Mastermind output), coin deductions, hint purchases, and win detection — all without re-rendering the world on every keystroke.
- **No backend.** Today's puzzle is determined by `new Date()` client-side, matched to a JSON filename. Keep it simple.
- **Don't over-engineer the UI early.** Get the game loop working correctly first. Polish second.

---

## Questions to Resolve During Development

- [ ] Exact coin cost per wrong rank slot (flat 10 per submission vs. 2 per wrong slot)
- [ ] Whether category guess costs coins on a miss
- [ ] Fuse.js threshold tuning (start at 0.35, adjust)
- [ ] Share card format for end screen
- [ ] Puzzle filename convention (`YYYY-MM-DD.json` is current assumption)
