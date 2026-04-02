export const GAME_CONFIG = {
  startingCoins: 100,

  bank: {
    freeMisses: 3,
    missCost: 1,      // coins per miss after free misses exhausted
  },

  category: {
    freeMisses: 3,
    missCost: 10,     // coins per miss after free misses exhausted
    correctGuessBonus: 15, // coins awarded for guessing the category correctly
  },

  ranking: {
    absentCost: 1,    // coins per item placed that isn't in the top 5
  },

  hints: {
    revealCategory: 40,
    revealBankItem: 15,
    revealRankPositionKnown: 30,    // item already in your bank
    revealRankPositionUnknown: 60,  // item not yet discovered
  },

  matcher: {
    // Fuse.js scores: 0 = perfect match, 1 = no match at all.
    // threshold = maximum score to include as a result (lower = stricter).
    bankThreshold: 0.25,
    bankConfidentThreshold: 0.08,   // below this score → auto-accept, no confirmation needed
    categoryThreshold: 0.15,
  },
};
