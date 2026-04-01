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
 *
 * Two-pass strategy:
 *   1. Fuse.js — catches typos when word order is similar
 *   2. Word-set overlap — catches reordered phrases ("Instagram most followed"
 *      vs "most followed accounts on Instagram")
 */
export function matchCategory(query, categoryString) {
  const q = query.trim();

  // Pass 1: Fuse (order-sensitive but typo-tolerant)
  const fuse = new Fuse([{ category: categoryString }], {
    keys: ['category'],
    threshold: CFG.categoryThreshold,
    isCaseSensitive: false,
    ignoreLocation: true,
  });
  if (fuse.search(q).length > 0) return true;

  // Pass 2: word-set overlap with per-word fuzzy matching (order-insensitive).
  // Handles morphological variants like "followers" ↔ "followed".
  const tokenize = s =>
    s.toLowerCase()
     .replace(/[^a-z0-9\s]/g, '')
     .split(/\s+/)
     .filter(w => w.length > 2);

  const catWords = tokenize(categoryString);
  const queryWords = tokenize(q);
  if (queryWords.length === 0) return false;

  const wordFuse = new Fuse(catWords.map(w => ({ w })), {
    keys: ['w'],
    threshold: 0.35,  // per-word fuzzy tolerance — catches stems/variants
    isCaseSensitive: false,
  });

  const matched = queryWords.filter(qw => wordFuse.search(qw).length > 0);

  // Require at least 60% of query words to match, minimum 1
  return matched.length >= Math.max(1, Math.ceil(queryWords.length * 0.6));
}
