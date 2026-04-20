// AI integrity detection rules.
//
// Each rule is a pure function: given a candidate AI interaction (and
// optionally context like the assignment's due date or the student's
// recent history), return null if clean or a flag string if suspicious.
//
// Rules are deliberately simple, explainable, and tunable. The principal
// has to be able to explain to a parent WHY a submission was flagged
// without mumbling about ML. Each flag carries a name plus a short reason.

import type { AuditLog, Assignment } from "@prisma/client";

export const AI_INTEGRITY_FLAGS = {
  SUSPICIOUS_PROMPT: "suspicious_prompt",
  LARGE_OUTPUT: "large_output",
  LAST_MINUTE: "last_minute",
  IDENTICAL_OUTPUT: "identical_output_to_other_student",
} as const;

export type AiIntegrityFlag =
  (typeof AI_INTEGRITY_FLAGS)[keyof typeof AI_INTEGRITY_FLAGS];

// Phrases students use when they want the AI to do the assignment for
// them. Match is case-insensitive, substring. Add to this list as we
// see new patterns in the wild.
const SUSPICIOUS_PROMPT_PATTERNS: RegExp[] = [
  /\bdo my (homework|assignment|essay|project)\b/i,
  /\bwrite (me )?(a |an )?(\d+\s*[-]?\s*(word|page|paragraph)\s+)?(essay|paragraph|paper|story|report|article)\b/i,
  /\bcomplete (this|my) assignment\b/i,
  /\bsolve (this|all) (problem|question|homework)s?\b/i,
  /\b(answer|complete) (the|these) (question|exercise)s?\b/i,
  /\bwrite (a|an|the) (introduction|conclusion|abstract) for\b/i,
  /\bsummari[sz]e this in your own words\b/i,
];

// CLAUDE.md §3.3 lists Writing AI / Code AI as legit. A 1500+ word
// response very often = the student pasted "write a 1500-word essay…"
// and the AI obliged. Worth a soft flag for teacher review.
const LARGE_OUTPUT_WORD_THRESHOLD = 800;

// "Last-minute" = AI activity within this many hours of the assignment
// due date. Trades off false-positives (legitimate last-day workers)
// against catching panic-cheating. 4 hours felt right for a 16-yo's
// schedule; tunable per-school later via AssignmentAiPolicy.
const LAST_MINUTE_HOURS = 4;

export interface RuleContext {
  assignment?: Pick<Assignment, "id" | "dueDate"> | null;
  // Caller pre-checks for identical responseHash on OTHER students.
  // We just take the boolean so rules stay pure and DB-free.
  identicalResponseExistsForOtherStudent?: boolean;
}

interface CandidateInteraction {
  promptText: string;
  aiResponse: string;
  responseLength: number;
  timestamp: Date;
}

export function evaluateRules(
  candidate: CandidateInteraction,
  ctx: RuleContext = {},
): AiIntegrityFlag[] {
  const flags: AiIntegrityFlag[] = [];

  // Rule 1 — Suspicious prompt phrasing
  if (SUSPICIOUS_PROMPT_PATTERNS.some((re) => re.test(candidate.promptText))) {
    flags.push(AI_INTEGRITY_FLAGS.SUSPICIOUS_PROMPT);
  }

  // Rule 2 — Large output (likely a verbatim "write me an essay" request)
  if (candidate.responseLength >= LARGE_OUTPUT_WORD_THRESHOLD) {
    flags.push(AI_INTEGRITY_FLAGS.LARGE_OUTPUT);
  }

  // Rule 3 — Last-minute AI burst near the assignment deadline
  if (ctx.assignment?.dueDate) {
    const hoursToDeadline =
      (ctx.assignment.dueDate.getTime() - candidate.timestamp.getTime()) /
      (1000 * 60 * 60);
    if (hoursToDeadline >= 0 && hoursToDeadline <= LAST_MINUTE_HOURS) {
      flags.push(AI_INTEGRITY_FLAGS.LAST_MINUTE);
    }
  }

  // Rule 4 — Same AI response another student also got (likely both
  // pasted the same prompt, or one student is sharing AI output)
  if (ctx.identicalResponseExistsForOtherStudent) {
    flags.push(AI_INTEGRITY_FLAGS.IDENTICAL_OUTPUT);
  }

  return flags;
}

/**
 * Cheap word count — splits on whitespace. Good enough for English-ish
 * prompts. Replace with a tokenizer when we add Hindi/regional support.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Lookup table for human-readable flag descriptions. Used by the
 * teacher integrity report and the principal dashboard.
 */
export const FLAG_DESCRIPTIONS: Record<AiIntegrityFlag, string> = {
  [AI_INTEGRITY_FLAGS.SUSPICIOUS_PROMPT]:
    "Prompt asks the AI to complete the assignment.",
  [AI_INTEGRITY_FLAGS.LARGE_OUTPUT]:
    "Response is unusually long (likely verbatim essay).",
  [AI_INTEGRITY_FLAGS.LAST_MINUTE]:
    "Activity within the final hours before the deadline.",
  [AI_INTEGRITY_FLAGS.IDENTICAL_OUTPUT]:
    "Another student got the same AI response.",
};
