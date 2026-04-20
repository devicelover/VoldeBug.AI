// Pure business logic for submissions. Lives outside the controller so it
// can be unit-tested without HTTP context (CLAUDE.md §5.3).

/**
 * Compute the XP awarded for a graded submission.
 *
 * The score-to-XP curve is intentionally generous at the top end so high
 * achievers still feel rewarded, but the math runs server-side so a
 * tampered grading payload can never inflate XP.
 *
 *   score 100  -> 200 XP
 *   score  90  -> 180 XP
 *   score  80  -> 160 XP
 *   score  60  -> 120 XP  (passing)
 *   score   0  ->   0 XP
 *
 * Plus an optional teacher quality bonus, hard-capped at +50 XP.
 *
 * @param score             0–100 numeric score (validated by Zod)
 * @param teacherBonusXp    0–50 optional teacher bonus (validated by Zod)
 */
export function computeGradeXp(
  score: number,
  teacherBonusXp = 0,
): number {
  // Clamp defensively even though Zod already validated upstream — services
  // shouldn't trust their inputs, ever.
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const safeBonus = Math.max(0, Math.min(50, Math.round(teacherBonusXp)));
  const baseXp = safeScore * 2; // 0..200
  return baseXp + safeBonus;
}
