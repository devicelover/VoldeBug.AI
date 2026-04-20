/**
 * Seed Voldebug's starter lesson-plan library.
 *
 * Five hand-crafted, NCERT-aligned lesson plans that demonstrate how a
 * teacher integrates AI into a 45-minute class ethically — as a thinking
 * partner, not an answer machine. Your faculty team extends this file
 * (or authors plans through the product UI) to ship dozens more.
 *
 * Run with: `pnpm exec tsx prisma/seed-lesson-plans.ts`
 * Or import from a CI step on release.
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type AiActivity = {
  step: number;
  instruction: string;
  suggestedPrompt: string;
  expectedLearning: string;
  timeMinutes: number;
};

type Resource = {
  type: "link" | "pdf" | "video";
  title: string;
  url: string;
};

type RubricCriterion = {
  name: string;
  weight: number;
  descriptors: { excellent: string; good: string; needs_work: string };
};

interface LessonPlanSeed {
  slug: string;
  title: string;
  summary: string;
  subject: string;
  gradeLevel: number;
  board: string;
  chapter?: string;
  chapterNumber?: number;
  difficulty: "easy" | "medium" | "hard";
  durationMinutes: number;
  learningObjectives: string[];
  aiActivities: AiActivity[];
  resources?: Resource[];
  rubricTemplate?: { criteria: RubricCriterion[] };
  tags: string[];
}

const LESSON_PLANS: LessonPlanSeed[] = [
  // ──────────────────────────────────────────────────────────────────────
  {
    slug: "class-9-science-force-laws-of-motion",
    title: "Force and Laws of Motion — Think Like Newton",
    summary:
      "Students derive Newton's three laws through everyday observations, using AI as a thought partner to test hypotheses and challenge misconceptions. By the end they can explain why a bus passenger lurches forward when the driver brakes — in their own words.",
    subject: "Science",
    gradeLevel: 9,
    board: "CBSE",
    chapter: "Force and Laws of Motion",
    chapterNumber: 8,
    difficulty: "medium",
    durationMinutes: 45,
    learningObjectives: [
      "State and explain Newton's three laws of motion",
      "Identify inertia in everyday situations",
      "Distinguish between mass and weight",
      "Recognize when AI explanations contain physical inaccuracies",
    ],
    aiActivities: [
      {
        step: 1,
        instruction:
          "Warm-up: each student describes one real-life situation where an object suddenly changes speed or direction. Share two with the class.",
        suggestedPrompt: "",
        expectedLearning:
          "Anchor the abstract concepts in concrete observations before introducing terminology.",
        timeMinutes: 5,
      },
      {
        step: 2,
        instruction:
          "Ask ChatGPT (or any chat AI) to explain Newton's first law using a cricket example. Compare with the NCERT textbook definition.",
        suggestedPrompt:
          "Explain Newton's first law of motion using an example from a cricket match. Keep the explanation under 80 words.",
        expectedLearning:
          "Notice that the AI's example may simplify or mis-state the role of friction. Practice verifying AI output against a trusted source.",
        timeMinutes: 10,
      },
      {
        step: 3,
        instruction:
          "Paired challenge: ask the AI a deliberately wrong physics question ('If I push a book twice as hard, does its mass double?'). Record the AI's answer and decide whether it corrected you or played along.",
        suggestedPrompt:
          "If I push a book twice as hard, does its mass double?",
        expectedLearning:
          "Spot when AI tools answer sloppily and why critical reading matters more than copy-paste.",
        timeMinutes: 10,
      },
      {
        step: 4,
        instruction:
          "Each student writes a 4-sentence summary of Newton's second law — F=ma — referencing ONE observation from step 1 and explicitly NOT copying the AI's wording.",
        suggestedPrompt: "",
        expectedLearning:
          "Internalize F=ma through their own example; demonstrate original articulation.",
        timeMinutes: 15,
      },
      {
        step: 5,
        instruction:
          "Log your full AI interaction on the Voldebug AI Activity Log and link it to this assignment.",
        suggestedPrompt: "",
        expectedLearning:
          "Transparency practice. Builds trust and makes your process visible to the teacher.",
        timeMinutes: 5,
      },
    ],
    resources: [
      {
        type: "link",
        title: "NCERT Class 9 Science, Chapter 8",
        url: "https://ncert.nic.in/textbook/pdf/iesc108.pdf",
      },
    ],
    rubricTemplate: {
      criteria: [
        {
          name: "Conceptual accuracy",
          weight: 40,
          descriptors: {
            excellent: "All three laws stated correctly with precise terminology.",
            good: "Laws stated with minor imprecision; overall meaning intact.",
            needs_work: "Confuses mass/weight or misstates at least one law.",
          },
        },
        {
          name: "Original articulation",
          weight: 30,
          descriptors: {
            excellent: "Summary is in the student's voice with a distinctive example.",
            good: "Summary is original but leans on textbook phrasing.",
            needs_work: "Reads like the AI response or textbook copy.",
          },
        },
        {
          name: "Critical evaluation of AI",
          weight: 30,
          descriptors: {
            excellent: "Identifies a specific inaccuracy or simplification in the AI's answer.",
            good: "Notices the AI was 'not quite right' but can't pinpoint why.",
            needs_work: "Accepts the AI answer without question.",
          },
        },
      ],
    },
    tags: ["physics", "newton", "laws-of-motion", "critical-thinking"],
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    slug: "class-10-history-nationalism-in-india",
    title: "Nationalism in India — Whose Voice Does AI Hear?",
    summary:
      "A source-critique lesson on the Indian freedom struggle (1918–1947). Students compare how mainstream AI tools describe key events versus NCERT and primary sources, learning to spot bias and omission in AI historical narratives.",
    subject: "History",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Nationalism in India",
    chapterNumber: 3,
    difficulty: "medium",
    durationMinutes: 60,
    learningObjectives: [
      "Describe key events of the Indian national movement (1918–1947)",
      "Analyze the role of Gandhi, Nehru, Subhas Bose, and Bhagat Singh",
      "Identify whose perspective is centered or omitted in AI-generated history",
      "Write a balanced summary citing multiple sources",
    ],
    aiActivities: [
      {
        step: 1,
        instruction:
          "Open the NCERT chapter and identify the three events we'll focus on: Rowlatt Satyagraha, Salt March, Quit India.",
        suggestedPrompt: "",
        expectedLearning: "Ground the lesson in primary textbook material.",
        timeMinutes: 10,
      },
      {
        step: 2,
        instruction:
          "Ask two different AI tools (e.g., ChatGPT and Gemini) to summarize the Salt March in 100 words. Save both responses.",
        suggestedPrompt:
          "In 100 words, summarize the Salt March led by Mahatma Gandhi in 1930.",
        expectedLearning:
          "Observe differences in framing, emphasis, and who the AI mentions (or omits).",
        timeMinutes: 10,
      },
      {
        step: 3,
        instruction:
          "Compare the two AI summaries with the NCERT version. In a table, note: (a) names mentioned by each source, (b) events emphasized, (c) anything missing.",
        suggestedPrompt: "",
        expectedLearning:
          "Structured comparative analysis. Recognize bias and silence in AI outputs.",
        timeMinutes: 20,
      },
      {
        step: 4,
        instruction:
          "Write a 200-word account of the Salt March in your own words, drawing from ALL three sources. Cite which source taught you each fact.",
        suggestedPrompt: "",
        expectedLearning:
          "Synthesize multiple sources and attribute them — the core historian skill.",
        timeMinutes: 15,
      },
      {
        step: 5,
        instruction:
          "Log your AI interactions and attach them to this assignment.",
        suggestedPrompt: "",
        expectedLearning: "Transparency.",
        timeMinutes: 5,
      },
    ],
    resources: [
      {
        type: "link",
        title: "NCERT Class 10 History, Chapter 3",
        url: "https://ncert.nic.in/textbook/pdf/jess203.pdf",
      },
    ],
    tags: ["history", "india", "source-criticism", "bias-detection"],
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    slug: "class-8-english-ai-as-writing-partner",
    title: "AI as a Writing Partner — Drafting a Short Story",
    summary:
      "Students write a 400-word short story with AI as a brainstorming assistant, then submit both their drafts AND the AI transcripts. The grade weights originality heavily — the AI is a tool for ideation, not a ghostwriter.",
    subject: "English",
    gradeLevel: 8,
    board: "CBSE",
    chapter: "Creative Writing Unit",
    difficulty: "easy",
    durationMinutes: 90,
    learningObjectives: [
      "Plan a short story with a clear arc (exposition, rising action, climax, resolution)",
      "Use AI for brainstorming without outsourcing authorship",
      "Revise first drafts based on targeted feedback",
      "Explain which story decisions were theirs and which were influenced by AI",
    ],
    aiActivities: [
      {
        step: 1,
        instruction:
          "Pick one setting, one character type, and one conflict from three index-card piles the teacher has prepared.",
        suggestedPrompt: "",
        expectedLearning:
          "Constrained creativity. Prevents the AI from choosing the story's seeds.",
        timeMinutes: 5,
      },
      {
        step: 2,
        instruction:
          "Brainstorm with AI: ask the AI to suggest three possible openings for your story. PICK ONE and write the rest yourself.",
        suggestedPrompt:
          "Suggest three different opening sentences for a short story set in [setting] about a [character type] facing [conflict]. Do not write the whole story.",
        expectedLearning:
          "Use AI to unblock the blank page without handing over creative control.",
        timeMinutes: 10,
      },
      {
        step: 3,
        instruction:
          "Write your full 400-word story WITHOUT asking the AI for more text. Use it only for spelling or synonym lookups.",
        suggestedPrompt: "",
        expectedLearning:
          "Authorial voice. 400 words of your own writing.",
        timeMinutes: 45,
      },
      {
        step: 4,
        instruction:
          "Ask the AI for feedback on one paragraph you're unsure about. Decide which suggestions to apply.",
        suggestedPrompt:
          "Here is one paragraph from my short story: [paragraph]. Give me three specific suggestions to strengthen it — do not rewrite it for me.",
        expectedLearning:
          "Use AI as a critic, not a co-author. Exercise editorial judgement.",
        timeMinutes: 15,
      },
      {
        step: 5,
        instruction:
          "Submit: (a) your story, (b) a 50-word reflection on which AI suggestions you used and which you rejected, (c) your logged AI transcripts.",
        suggestedPrompt: "",
        expectedLearning:
          "Metacognition. Articulating your own creative choices separates learning from copy-paste.",
        timeMinutes: 15,
      },
    ],
    rubricTemplate: {
      criteria: [
        {
          name: "Story craft",
          weight: 40,
          descriptors: {
            excellent: "Clear arc, vivid imagery, satisfying resolution.",
            good: "Arc present; imagery serviceable.",
            needs_work: "Arc unclear or missing.",
          },
        },
        {
          name: "Authentic voice",
          weight: 30,
          descriptors: {
            excellent: "Reads like the student. AI influence is strategic, not dominant.",
            good: "Mostly the student with occasional AI-flavored phrasing.",
            needs_work: "Reads like the AI wrote it.",
          },
        },
        {
          name: "Reflection quality",
          weight: 30,
          descriptors: {
            excellent: "Names specific AI suggestions and explains editorial decisions.",
            good: "Acknowledges AI use but vaguely.",
            needs_work: "No reflection or denial of AI use when it was clearly present.",
          },
        },
      ],
    },
    tags: ["english", "creative-writing", "ideation", "authorship"],
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    slug: "class-10-math-quadratic-equations",
    title: "Quadratic Equations — Use AI to Check Your Work, Not Skip It",
    summary:
      "A discipline lesson disguised as a math lesson. Students solve five quadratic equations by hand, then use AI only to verify their answers. Marks are given for the work shown, not the final answer.",
    subject: "Mathematics",
    gradeLevel: 10,
    board: "CBSE",
    chapter: "Quadratic Equations",
    chapterNumber: 4,
    difficulty: "medium",
    durationMinutes: 45,
    learningObjectives: [
      "Solve quadratic equations using factorisation, completing the square, and the quadratic formula",
      "Use AI to verify answers but not to generate solutions",
      "Explain each algebraic step in writing",
    ],
    aiActivities: [
      {
        step: 1,
        instruction:
          "Solve all five equations on paper, showing every step. Time: 25 minutes.",
        suggestedPrompt: "",
        expectedLearning: "Manual fluency with the three solution methods.",
        timeMinutes: 25,
      },
      {
        step: 2,
        instruction:
          "For each equation, ask an AI tool ONLY for the final roots. Compare them to your answers.",
        suggestedPrompt:
          "What are the roots of the quadratic equation [equation]? Give only the roots, no working.",
        expectedLearning:
          "AI as a verification tool. Builds the habit of self-checking without outsourcing the thinking.",
        timeMinutes: 5,
      },
      {
        step: 3,
        instruction:
          "For any equation where your answer disagreed with the AI, re-trace your working. Identify WHERE the error was. If the AI was wrong (it happens), explain why.",
        suggestedPrompt: "",
        expectedLearning:
          "Error analysis is often more educational than getting it right first time.",
        timeMinutes: 10,
      },
      {
        step: 4,
        instruction:
          "Submit your working, your AI transcripts, and a one-sentence note on each equation: what you learned from checking.",
        suggestedPrompt: "",
        expectedLearning: "Reflection and submission discipline.",
        timeMinutes: 5,
      },
    ],
    tags: ["mathematics", "quadratic", "algebra", "self-checking"],
  },

  // ──────────────────────────────────────────────────────────────────────
  {
    slug: "class-11-biology-cell-the-unit-of-life",
    title: "Cell: The Unit of Life — Diagram Critique with AI",
    summary:
      "Students generate labeled cell diagrams with an AI image tool, then critique what the AI got wrong by comparing against a microscope slide / NCERT illustration. Excellent for introducing AI limitations in a wet-science context.",
    subject: "Biology",
    gradeLevel: 11,
    board: "CBSE",
    chapter: "Cell: The Unit of Life",
    chapterNumber: 8,
    difficulty: "medium",
    durationMinutes: 45,
    learningObjectives: [
      "Identify and describe organelles of eukaryotic cells",
      "Compare plant and animal cells",
      "Evaluate the accuracy of AI-generated scientific diagrams",
    ],
    aiActivities: [
      {
        step: 1,
        instruction:
          "Quick recap: list the major organelles and their functions in your notebook.",
        suggestedPrompt: "",
        expectedLearning: "Retrieval practice grounds the rest of the lesson.",
        timeMinutes: 10,
      },
      {
        step: 2,
        instruction:
          "Use an AI image generator (e.g., DALL·E, Gemini) to produce a labeled diagram of a plant cell. Save or screenshot it.",
        suggestedPrompt:
          "Generate a labeled diagram of a plant cell showing: nucleus, cell wall, chloroplast, mitochondrion, vacuole, endoplasmic reticulum.",
        expectedLearning:
          "See firsthand that image AIs often mislabel or hallucinate organelles.",
        timeMinutes: 5,
      },
      {
        step: 3,
        instruction:
          "Against the NCERT diagram, identify every error in the AI's image. Circle each and write one sentence explaining the correct structure/position.",
        suggestedPrompt: "",
        expectedLearning:
          "Active error-finding locks in correct anatomy better than passive reading.",
        timeMinutes: 20,
      },
      {
        step: 4,
        instruction:
          "Answer in your notebook: 'Would this AI image be safe to use in a school textbook? Why or why not?' (75 words)",
        suggestedPrompt: "",
        expectedLearning:
          "Professional judgment about when AI output is fit-for-purpose.",
        timeMinutes: 10,
      },
    ],
    tags: ["biology", "cell", "organelles", "ai-limitations", "visual-literacy"],
  },
];

// ── Seed runner ────────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding ${LESSON_PLANS.length} lesson plans…`);

  for (const plan of LESSON_PLANS) {
    const {
      aiActivities,
      resources,
      rubricTemplate,
      ...rest
    } = plan;

    await prisma.lessonPlan.upsert({
      where: { slug: plan.slug },
      // Update keeps seeds re-runnable without deleting teacher customizations.
      update: {
        ...rest,
        aiActivities: aiActivities as unknown as Prisma.InputJsonValue,
        resources: (resources ?? []) as unknown as Prisma.InputJsonValue,
        rubricTemplate: rubricTemplate
          ? (rubricTemplate as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        isOfficial: true,
        isPublic: true,
      },
      create: {
        ...rest,
        aiActivities: aiActivities as unknown as Prisma.InputJsonValue,
        resources: (resources ?? []) as unknown as Prisma.InputJsonValue,
        rubricTemplate: rubricTemplate
          ? (rubricTemplate as unknown as Prisma.InputJsonValue)
          : undefined,
        isOfficial: true,
        isPublic: true,
      },
    });
    console.log(`  ✓ ${plan.slug}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
