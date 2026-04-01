import { GAME_CONFIG } from '../config.js';

/**
 * Returns the coin cost for a bank miss.
 * missCount = number of bank misses already recorded (before this one).
 */
export function getBankMissCost(missCount) {
  if (missCount < GAME_CONFIG.bank.freeMisses) return 0;
  return GAME_CONFIG.bank.missCost;
}

/**
 * Returns the coin cost for a category miss.
 * missCount = number of category misses already recorded (before this one).
 */
export function getCategoryMissCost(missCount) {
  if (missCount < GAME_CONFIG.category.freeMisses) return 0;
  return GAME_CONFIG.category.missCost;
}

/** Returns the coin cost for a wrong ranking submission. */
export function getRankingMissCost() {
  return GAME_CONFIG.ranking.missCost;
}

/** Returns the coin cost for a given hint type. */
export function getHintCost(hintType) {
  return GAME_CONFIG.hints[hintType] ?? 0;
}
