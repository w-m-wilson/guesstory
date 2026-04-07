import { DIFFICULTY_CONFIG } from '../config.js';

function cfg(difficulty) {
  return DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.medium;
}

export function getBankMissCost(missCount, difficulty = 'medium') {
  const c = cfg(difficulty).bank;
  return missCount < c.freeMisses ? 0 : c.missCost;
}

export function getCategoryMissCost(missCount, difficulty = 'medium') {
  const c = cfg(difficulty).category;
  return missCount < c.freeMisses ? 0 : c.missCost;
}

export function getCategoryBonus(difficulty = 'medium') {
  return cfg(difficulty).category.correctGuessBonus;
}

export function getRankingAbsentCost(difficulty = 'medium') {
  return cfg(difficulty).ranking.absentCost;
}

export function getHintCost(hintType, difficulty = 'medium') {
  return cfg(difficulty).hints[hintType] ?? 0;
}

// Returns the free-miss count for the bank (same across all difficulties currently)
export function getBankFreeMisses(difficulty = 'medium') {
  return cfg(difficulty).bank.freeMisses;
}
