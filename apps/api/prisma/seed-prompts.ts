/**
 * Seed Voldebug's CBSE-aligned AI prompt library.
 *
 * Each entry is a hand-crafted, ready-to-paste prompt mapped to a real
 * NCERT/CBSE chapter and a recommended Tool. Every prompt models the
 * "thought partner not ghostwriter" stance — no "write my essay for me"
 * material here.
 *
 * Run: pnpm exec tsx prisma/seed-prompts.ts
 * Idempotent — uses upsert by slug.
 */

import { PrismaClient, type PromptKind } from "@prisma/client";

const prisma = new PrismaClient();

interface PromptSeed {
  slug: string;
  title: string;
  prompt: string;
  description: string;
  subject: string;
  gradeLevel: number;
  board: string;
  chapter?: string;
  chapterNumber?: number;
  topic?: string;
  kind: PromptKind;
  toolName?: string; // resolved to recommendedToolId at seed time
  tags: string[];
}

const PROMPTS: PromptSeed[] = [
  // ── CLASS 9 SCIENCE ─────────────────────────────────────────────────
  {
    slug: "c9-sci-newton-everyday-example",
    title: "Newton's first law in cricket",
    prompt:
      "Explain Newton's first law of motion using an example from a cricket match. Keep the explanation under 80 words and avoid using the word 'inertia' until the very last sentence.",
    description:
      "Asks the AI to explain a physics concept through a familiar Indian-context example, with a writing constraint that forces a clearer explanation.",
    subject: "Science",
    gradeLevel: 9,
    board: "CBSE",
    chapter: "Force and Laws of Motion",
    chapterNumber: 8,
    topic: "Newton's first law",
    kind: "EXPLORE",
    toolName: "ChatGPT",
    tags: ["physics", "newton", "concept-explanation"],
  },
  {
    slug: "c9-sci-newton-fact-check",
    title: "Spot AI mistakes about momentum",
    prompt:
      "I will give you a statement about momentum. Tell me whether it is correct, and if not, explain WHY it is wrong without giving me the correct version. Statement: 'A heavier object always has more momentum than a lighter one.'",
    description:
      "Trains students to use AI as a verifier. The 'don't give me the correct version' constraint keeps the thinking with the student.",
    subject: "Science",
    gradeLevel: 9,
    board: "CBSE",
    chapter: "Force and Laws of Motion",
    chapterNumber: 8,
    kind: "VERIFY",
    toolName: "ChatGPT",
    tags: ["physics", "critical-thinking"],
  },
  {
    slug: "c9-sci-tissues-mind-map",
    title: "Map the four animal tissues",
    prompt:
      "Generate a textual mind map of the four major animal tissues (epithelial, connective, muscular, nervous). For each, list 2 sub-types, 1 location in the body, and 1 main function — strict bullet form, no paragraphs.",
    description:
      "Forces structured output that becomes revision-ready notes.",
    subject: "Science",
    gradeLevel: 9,
    board: "CBSE",
    chapter: "Tissues",
    chapterNumber: 6,
    kind: "SUMMARIZE",
    toolName: "Claude",
    tags: ["biology", "tissues", "revision"],
  },

  // ── CLASS 10 SCIENCE ─────────────────────────────────────────────────
  {
    slug: "c10-sci-light-mirror-practice",
    title: "Generate 5 ray-diagram problems",
    prompt:
      "Generate 5 numerical problems on concave mirrors at Class 10 CBSE difficulty. Vary object distance (15 cm to 60 cm) and focal length (10 cm to 25 cm). Give ONLY the questions and a final answer key — no working.",
    description:
      "Practice-set generator. Student does the working themselves; AI just produces the questions and the final-answer key for self-checking.",
    subject: "Science",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Light – Reflection and Refraction",
    chapterNumber: 9,
    kind: "PRACTICE",
    toolName: "ChatGPT",
    tags: ["physics", "optics", "practice"],
  },
  {
    slug: "c10-sci-acids-bases-misconception-hunt",
    title: "Find common student misconceptions",
    prompt:
      "List the 5 most common misconceptions students hold about acids and bases at the Class 10 level. For each, give a one-line correction. Don't include topics from any other chapter.",
    description:
      "Useful for revision — converts the chapter into a focused 'errors to avoid' checklist.",
    subject: "Science",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Acids, Bases and Salts",
    chapterNumber: 2,
    kind: "REFLECT",
    toolName: "Claude",
    tags: ["chemistry", "misconceptions"],
  },

  // ── CLASS 10 MATH ────────────────────────────────────────────────────
  {
    slug: "c10-math-quadratic-check-only",
    title: "Verify quadratic equation roots",
    prompt:
      "Are the roots of the quadratic equation [PASTE EQUATION HERE] real and distinct, real and equal, or imaginary? Answer ONLY with one of those three labels and the discriminant value. Do not solve for the roots.",
    description:
      "Verification-only mode. Student calculates the discriminant themselves, AI confirms. Replace [PASTE EQUATION HERE] with your equation.",
    subject: "Mathematics",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Quadratic Equations",
    chapterNumber: 4,
    kind: "VERIFY",
    toolName: "Khan Academy Khanmigo",
    tags: ["mathematics", "quadratic", "self-checking"],
  },
  {
    slug: "c10-math-trigonometry-real-life",
    title: "Trig in real-world problems",
    prompt:
      "Give me three real-world problems where trigonometric ratios are needed to find a height or distance. Set them in an Indian context (a temple, a kite, a riverbank). State the problem only — no solutions.",
    description:
      "Trig word-problem generator with culturally relevant settings. Student solves on their own.",
    subject: "Mathematics",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Some Applications of Trigonometry",
    chapterNumber: 9,
    kind: "PRACTICE",
    toolName: "ChatGPT",
    tags: ["mathematics", "trigonometry", "word-problems"],
  },

  // ── CLASS 10 HISTORY ─────────────────────────────────────────────────
  {
    slug: "c10-hist-salt-march-perspectives",
    title: "Salt March from three perspectives",
    prompt:
      "Describe the Salt March of 1930 in 3 short paragraphs, each from a different perspective: (1) a participating villager from Dandi, (2) a British colonial official, (3) a journalist for an international paper. Each paragraph should be under 80 words.",
    description:
      "Multi-perspective writing prompt that builds source-criticism skills the chapter expects.",
    subject: "History",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Nationalism in India",
    chapterNumber: 3,
    kind: "EXPLORE",
    toolName: "Perplexity",
    tags: ["history", "india", "perspective-taking"],
  },
  {
    slug: "c10-hist-gandhi-vs-ambedkar",
    title: "Gandhi vs Ambedkar on Poona Pact",
    prompt:
      "What were the main areas of disagreement between Gandhi and B.R. Ambedkar leading to the 1932 Poona Pact? List 3 specific points. For each, cite the year and context. Indicate which point you find best documented and why.",
    description:
      "Asks the AI to take an evidentiary position, not just summarise. Student then evaluates the AI's reasoning.",
    subject: "History",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Nationalism in India",
    chapterNumber: 3,
    kind: "REFLECT",
    toolName: "Perplexity",
    tags: ["history", "ambedkar", "primary-sources"],
  },

  // ── CLASS 9 / 10 ENGLISH ─────────────────────────────────────────────
  {
    slug: "c9-eng-essay-three-openings",
    title: "Three opening lines for a story",
    prompt:
      "Suggest three very different opening sentences for a short story set in [SETTING] about a [CHARACTER] facing [CONFLICT]. Don't write any more of the story — only the openings.",
    description:
      "Pure ideation, no ghostwriting. Replace the bracketed placeholders with your own choices.",
    subject: "English",
    gradeLevel: 9,
    board: "CBSE",
    chapter: "Creative Writing Unit",
    kind: "EXPLORE",
    toolName: "Claude",
    tags: ["english", "creative-writing", "ideation"],
  },
  {
    slug: "c10-eng-paragraph-critique",
    title: "Paragraph critique without rewrite",
    prompt:
      "Here is one paragraph from my essay: [PASTE]. Give me three SPECIFIC suggestions to make it stronger — clarity, structure, or word choice. Do not rewrite the paragraph for me.",
    description:
      "AI as a critic, not a co-author. Encourages editorial judgement.",
    subject: "English",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Writing skills",
    kind: "FEEDBACK",
    toolName: "Grammarly",
    tags: ["english", "writing", "feedback"],
  },
  {
    slug: "c9-eng-vocab-stronger-words",
    title: "Better word choices",
    prompt:
      "Give me three stronger alternatives to the word [WORD] in this sentence: '[SENTENCE]'. For each alternative, explain in one sentence what shade of meaning it adds.",
    description:
      "Vocabulary expansion that goes beyond synonyms — students learn nuance.",
    subject: "English",
    gradeLevel: 9,
    board: "CBSE",
    chapter: "Vocabulary",
    kind: "EXPLORE",
    toolName: "QuillBot",
    tags: ["english", "vocabulary"],
  },

  // ── CLASS 11 BIOLOGY ─────────────────────────────────────────────────
  {
    slug: "c11-bio-cell-organelle-quiz-me",
    title: "Quiz me on organelles",
    prompt:
      "Ask me five short questions on the structure and function of plant cell organelles. Wait for my answer to each before giving the next. Don't give me the correct answer until I've attempted it.",
    description:
      "Socratic study buddy. Tests recall actively rather than passively reading notes.",
    subject: "Biology",
    gradeLevel: 11,
    board: "CBSE",
    chapter: "Cell: The Unit of Life",
    chapterNumber: 8,
    kind: "REFLECT",
    toolName: "Khan Academy Khanmigo",
    tags: ["biology", "cell", "active-recall"],
  },

  // ── CLASS 8 SCIENCE ──────────────────────────────────────────────────
  {
    slug: "c8-sci-friction-explain-yourself",
    title: "Explain why friction matters",
    prompt:
      "Imagine you're explaining friction to a Class 5 student. Write a 4-line explanation that includes one example of when friction helps and one when it makes things harder. Use simple Hindi-English code-mixed phrases if it helps.",
    description:
      "'Teach to learn' — explaining at a lower level reveals where the student's own understanding is shaky.",
    subject: "Science",
    gradeLevel: 8,
    board: "CBSE",
    chapter: "Friction",
    chapterNumber: 12,
    kind: "EXPLORE",
    toolName: "ChatGPT",
    tags: ["physics", "friction", "teach-to-learn"],
  },

  // ── CIVICS / POLITICAL SCIENCE ───────────────────────────────────────
  {
    slug: "c10-civ-federalism-india-vs-us",
    title: "Federalism: India vs USA",
    prompt:
      "Compare federalism in India and the United States in a short table with 4 rows: division of powers, role of the supreme court, language policy, residuary powers. Cite which constitution article governs each in India.",
    description:
      "Comparative civics. The 'cite the article' constraint forces the AI to give verifiable specifics.",
    subject: "Political Science",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Federalism",
    chapterNumber: 2,
    kind: "EXPLORE",
    toolName: "Perplexity",
    tags: ["civics", "federalism", "comparison"],
  },
];

async function main() {
  console.log(`Seeding ${PROMPTS.length} prompt recipes…`);

  // Pre-resolve tool name → id once
  const allTools = await prisma.tool.findMany({
    select: { id: true, name: true },
  });
  const toolByName = new Map(allTools.map((t) => [t.name, t.id]));

  for (const p of PROMPTS) {
    const recommendedToolId = p.toolName
      ? (toolByName.get(p.toolName) ?? null)
      : null;
    const { toolName: _toolName, ...rest } = p;

    await prisma.promptRecipe.upsert({
      where: { slug: p.slug },
      update: {
        ...rest,
        recommendedToolId,
        isOfficial: true,
        isPublic: true,
      },
      create: {
        ...rest,
        recommendedToolId,
        isOfficial: true,
        isPublic: true,
      },
    });
    console.log(`  ✓ ${p.slug}  ${p.toolName ? `→ ${p.toolName}` : ""}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
