/**
 * Generates a unique 2-letter key for each bank item.
 *
 * Strategy (in priority order):
 *   Multi-word name → initials of first two words (Lionel Messi → LM)
 *   Single-word name → first two letters (Beyoncé → BE)
 *   Collision → try alternative letter combos, then numeric suffix
 *
 * Returns { [rank]: 'XX' } for all items in the bank.
 */

function candidates(name) {
  const words = name.trim().split(/\s+/)
  const out = []

  if (words.length >= 2) {
    // Primary: initials of first two words
    out.push(words[0][0] + words[1][0])
    // Alt: first letter + second letter of second word
    if (words[1].length > 1) out.push(words[0][0] + words[1][1])
    // Alt: first two letters of first word
    out.push(words[0].slice(0, 2))
    // Alt: first letter + initial of third word
    if (words.length >= 3) out.push(words[0][0] + words[2][0])
  } else {
    // Single word
    out.push(name.slice(0, 2))
    if (name.length > 2) out.push(name[0] + name[2])
    if (name.length > 3) out.push(name[0] + name[3])
  }

  // Numeric fallbacks
  const base = out[0]?.[0] ?? name[0]
  for (let i = 2; i <= 9; i++) out.push(base + i)

  return out.map(s => s.toUpperCase())
}

export function buildItemKeys(bankItems) {
  const used = new Set()
  const keyMap = {}   // rank → key

  for (const item of bankItems) {
    for (const candidate of candidates(item.name)) {
      if (!used.has(candidate)) {
        keyMap[item.rank] = candidate
        used.add(candidate)
        break
      }
    }
  }

  return keyMap
}
