// ─── Auto-prompt suggestions ─────────────────────────────────────────────
//
// Given a context (subject + optional assignment), surface prompts that
// model good academic AI use. These get shown as clickable chips on the
// AI Chat and AI Log pages.
//
// Suggestions come from two sources, merged in order:
//   1. The linked assignment's lesson-plan activities (highest priority —
//      directly what the teacher wants them to ask)
//   2. Subject-specific curated defaults baked in below
//
// Adding a new subject = append to SUBJECT_DEFAULTS. Keep each entry
// short, verb-first, and aligned with the "thought partner not
// ghostwriter" pedagogical stance CLAUDE.md §2 commits us to.

import { prisma } from "../../utils/prisma.js";

export interface PromptSuggestion {
  title: string;      // short label shown on the chip
  prompt: string;     // what to paste into the chat
  kind: "explore" | "verify" | "feedback" | "reflect";
  source: "lesson_plan" | "curated";
}

const SUBJECT_DEFAULTS: Record<string, PromptSuggestion[]> = {
  "Science": [
    {
      title: "Explain a concept",
      prompt:
        "Explain [concept] in simple terms using an example from everyday life. Keep it under 80 words.",
      kind: "explore",
      source: "curated",
    },
    {
      title: "Verify my understanding",
      prompt:
        "Here is my own explanation of [concept]: [paste your explanation]. Point out anything I got wrong, without giving me the full correct version.",
      kind: "verify",
      source: "curated",
    },
    {
      title: "Challenge me",
      prompt:
        "Ask me three questions to test whether I understand [concept]. Don't give me the answers yet.",
      kind: "reflect",
      source: "curated",
    },
  ],
  "Mathematics": [
    {
      title: "Explain an approach",
      prompt:
        "Explain the idea behind solving [type of problem] — don't solve my specific problem for me.",
      kind: "explore",
      source: "curated",
    },
    {
      title: "Check an answer",
      prompt:
        "Is [my answer] correct for the equation [equation]? Just yes/no with one sentence. Don't show working.",
      kind: "verify",
      source: "curated",
    },
    {
      title: "Find my error",
      prompt:
        "Here is my working: [paste]. I got stuck at step [X]. Tell me which step has the error — I'll fix it myself.",
      kind: "feedback",
      source: "curated",
    },
  ],
  "English": [
    {
      title: "Three opening ideas",
      prompt:
        "Suggest three very different opening sentences for a story about [topic]. Do not write the full story.",
      kind: "explore",
      source: "curated",
    },
    {
      title: "Critique my paragraph",
      prompt:
        "Here is a paragraph from my essay: [paste]. Give me three specific, concrete suggestions to strengthen it. Don't rewrite it.",
      kind: "feedback",
      source: "curated",
    },
    {
      title: "Find a better word",
      prompt:
        "Suggest three stronger alternatives to the word '[word]' in this sentence: [sentence].",
      kind: "explore",
      source: "curated",
    },
  ],
  "History": [
    {
      title: "Multiple perspectives",
      prompt:
        "What are the main perspectives historians have on [event]? Who disagrees and why?",
      kind: "explore",
      source: "curated",
    },
    {
      title: "Compare sources",
      prompt:
        "Compare how a textbook and a primary source might each describe [event]. What would each emphasise?",
      kind: "reflect",
      source: "curated",
    },
    {
      title: "Spot bias",
      prompt:
        "Here is a short paragraph about [event]: [paste]. What perspectives or groups are missing?",
      kind: "verify",
      source: "curated",
    },
  ],
  "Biology": [
    {
      title: "Explain a process",
      prompt:
        "Explain [process] in five short steps. Use analogies a Class [X] student would recognise.",
      kind: "explore",
      source: "curated",
    },
    {
      title: "Critique a diagram",
      prompt:
        "Here is a labeled diagram I found: [description]. What common errors do students make in this kind of diagram?",
      kind: "verify",
      source: "curated",
    },
  ],
};

// Fallback shown when no subject is supplied. Deliberately meta — these
// are prompts ABOUT using prompts well.
const GENERIC_DEFAULTS: PromptSuggestion[] = [
  {
    title: "Think with me",
    prompt:
      "I'm working on [topic]. Ask me three questions that would help me plan my approach.",
    kind: "reflect",
    source: "curated",
  },
  {
    title: "Summarise then let me extend",
    prompt:
      "Summarise [source] in 4 bullet points. I'll add my own analysis afterwards.",
    kind: "explore",
    source: "curated",
  },
  {
    title: "Point out gaps",
    prompt:
      "Here's what I understand so far: [paste]. What am I missing or oversimplifying?",
    kind: "verify",
    source: "curated",
  },
];

// ─── Getter ──────────────────────────────────────────────────────────────

export async function getSuggestions(input: {
  subject?: string | null;
  assignmentId?: string | null;
}): Promise<PromptSuggestion[]> {
  const suggestions: PromptSuggestion[] = [];

  // 1. If this chat is scoped to an assignment whose class has a linked
  //    lesson plan, show the lesson plan's own suggestedPrompts first.
  if (input.assignmentId) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: input.assignmentId },
      select: { title: true, description: true, class: { select: { name: true } } },
    });
    // Lesson plans aren't directly linked to assignments in the schema
    // yet — we look them up by fuzzy title match so the teacher gets the
    // prompts they expected without a separate wiring step.
    if (assignment) {
      const fuzzy = await prisma.lessonPlan.findFirst({
        where: {
          OR: [
            { title: { contains: assignment.title.slice(0, 40), mode: "insensitive" } },
            { slug: { contains: assignment.title.toLowerCase().slice(0, 40).replace(/\s+/g, "-") } },
          ],
          isPublic: true,
          deletedAt: null,
        },
        select: { aiActivities: true, subject: true },
      });
      if (fuzzy) {
        const acts = fuzzy.aiActivities as unknown as Array<{
          step: number;
          instruction: string;
          suggestedPrompt: string;
          expectedLearning: string;
        }>;
        for (const a of acts) {
          if (a.suggestedPrompt && a.suggestedPrompt.trim()) {
            suggestions.push({
              title: `Step ${a.step} — ${a.expectedLearning.slice(0, 40)}${a.expectedLearning.length > 40 ? "…" : ""}`,
              prompt: a.suggestedPrompt,
              kind: "explore",
              source: "lesson_plan",
            });
          }
        }
        if (!input.subject) input.subject = fuzzy.subject;
      }
    }
  }

  // 2. Subject defaults (if subject known) or generic.
  const defaults = input.subject
    ? (SUBJECT_DEFAULTS[input.subject] ?? GENERIC_DEFAULTS)
    : GENERIC_DEFAULTS;

  // Cap combined at 8 chips so the UI stays scannable.
  return [...suggestions, ...defaults].slice(0, 8);
}
