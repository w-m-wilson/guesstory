export const GAME_CONFIG = {
  startingCoins: 100,

  bank: {
    freeMisses: 3,
    missCost: 1,      // coins per miss after free misses exhausted
  },

  category: {
    freeMisses: 2,
    missCost: 1,      // coins per miss after free misses exhausted
  },

  ranking: {
    missCost: 10,     // flat cost per wrong ranking submission; formula TBD
  },

  hints: {
    revealCategory: 25,
    revealBankItem: 20,
    revealRankPosition: 50,
  },

  matcher: {
    // Fuse.js scores: 0 = perfect match, 1 = no match at all.
    // threshold = maximum score to include as a result (lower = stricter).
    bankThreshold: 0.4,
    bankConfidentThreshold: 0.15,   // below this score → auto-accept, no confirmation needed
    categoryThreshold: 0.4,
  },
};
