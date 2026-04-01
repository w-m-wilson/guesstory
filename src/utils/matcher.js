import Fuse from 'fuse.js';
import { GAME_CONFIG } from '../config.js';

const { matcher: CFG } = GAME_CONFIG;

/**
 * Creates a reusable bank matcher for a puzzle's item list.
 *
 * Flattens all names + aliases into a single searchable index.
 * Returns a match() function.
 *
 * match(query) returns:
 *   null                                    → no match (treat as a miss)
 *   { item, score, needsConfirmation }      → match found
 *     needsConfirmation: true means the match was fuzzy enough to warrant
 *     asking the player "did you mean X?" before counting it as a guess.
 */
export function createBankMatcher(items) {
  const entries = items.flatMap(item =>
    [item.name, ...item.aliases].map(alias => ({ alias, item }))
  );

  const fuse = new Fuse(entries, {
    keys: ['alias'],
    threshold: CFG.bankThreshold,
    includeScore: true,
    isCaseSensitive: false,
    ignoreLocation: true,   // don't penalize match position within string
  });

  return {
    match(query) {
      const results = fuse.search(query.trim());
      if (results.length === 0) return null;

      const { item: entry, score } = results[0];
      return {
        item: entry.item,
        score,
        needsConfirmation: score > CFG.bankConfidentThreshold,
      };
    },
  };
}

/**
 * Returns true if the query approximately matches the puzzle's category string.
 */
export function matchCategory(query, categoryString) {
  const fuse = new Fuse([{ category: categoryString }], {
    keys: ['category'],
    threshold: CFG.categoryThreshold,
    isCaseSensitive: false,
    ignoreLocation: true,
  });

  return fuse.search(query.trim()).length > 0;
}
