# Reckon

A daily mobile-first ranking game. Discover items from a hidden ranked list, then arrange the top 5 in the correct order. Think Wordle × Mastermind × trivia.

## How it works

Each day has a new puzzle — a ranked list of 8–10 real-world items with a hidden category (e.g. "Most followed accounts on Instagram"). You start with some items revealed and 100 coins.

**Discover items** by typing names into the guess bar. Fuzzy matching handles nicknames and typos. You get 3 free misses before wrong guesses start costing coins (cost depends on difficulty).

**Rank them** by tapping discovered items into 5 numbered slots and hitting Submit. You get Mastermind-style feedback:
- `●` correct position
- `○` in the top 5 but wrong position
- (nothing) not in the top 5

Wrong submissions cost coins per absent item (0–2 coins depending on difficulty).

**Guess the category** for a +15 coin bonus. Or spend coins in the hint shop to reveal items, pin a rank position, get a nudge clue, or unlock the category outright.

Run out of coins and it's game over. Final score = coins remaining.

## Difficulty

| | Lite | Medium | Challenge |
|---|---|---|---|
| Bank miss cost | 0 | 1 | 2 |
| Category miss cost | 2 | 5 | 8 |
| Absent slot cost | 0 | 1 | 2 |
| Seed items given | Most | Some | Fewest |

## Stack

- React 19 + Vite 8
- Tailwind v4 (via `@tailwindcss/vite`, no PostCSS config)
- 4 color schemes (Gruvbox, Solarized, Minimal, Bailly) × light/dark
- Fuse.js for fuzzy matching
- `useReducer` + `localStorage` for game state (no database)
- Vercel Functions + Claude Haiku for category checking, hints, and recap

## Puzzle format

Puzzles are static JSON files in `src/data/puzzles/YYYY-MM-DD.json`. See `agent.md` for the full schema and game design reference.

## Dev

```bash
npm install
npm run dev      # localhost:5173
npm run build    # production build → dist/
```

All game parameters (costs, thresholds, hint prices) are in `src/config.js`.
