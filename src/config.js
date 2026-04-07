export const GAME_CONFIG = {
  startingCoins: 100,

  matcher: {
    // Fuse.js scores: 0 = perfect match, 1 = no match at all.
    // threshold = maximum score to include as a result (lower = stricter).
    bankThreshold: 0.25,
    bankConfidentThreshold: 0.08,   // below this score → auto-accept, no confirmation needed
    categoryThreshold: 0.15,
  },
};

export const DIFFICULTY_CONFIG = {
  lite: {
    bank:     { freeMisses: 3, missCost: 0 },
    category: { freeMisses: 3, missCost: 2, correctGuessBonus: 15 },
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
    category: { freeMisses: 3, missCost: 5, correctGuessBonus: 15 },
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
    category: { freeMisses: 3, missCost: 8, correctGuessBonus: 15 },
    ranking:  { absentCost: 2 },
    hints: {
      revealBankItem: 8,
      revealRankPositionKnown: 15,
      revealCategoryNudge: 15,
      revealRankPositionUnknown: 45,
      revealCategory: 60,
    },
  },
};
