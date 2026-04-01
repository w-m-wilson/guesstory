/**
 * Generates Mastermind-style feedback for a ranking submission.
 *
 * slots: array[5] of item ({ rank, name, ... }) or null
 *   Index 0 = rank position 1, index 4 = rank position 5.
 *
 * Returns array[5] of:
 *   'correct'  → ● item is in the top 5 AND in the correct position
 *   'present'  → ○ item is in the top 5 but in the wrong position
 *   'absent'   → ✗ item is not in the top 5 (rank 6–10)
 *   'empty'    → slot was left blank
 */
export function generateFeedback(slots) {
  return slots.map((item, index) => {
    if (!item) return 'empty';
    const expectedRank = index + 1;
    if (item.rank === expectedRank) return 'correct';
    if (item.rank >= 1 && item.rank <= 5) return 'present';
    return 'absent';
  });
}

export function isWin(feedback) {
  return feedback.length === 5 && feedback.every(f => f === 'correct');
}
