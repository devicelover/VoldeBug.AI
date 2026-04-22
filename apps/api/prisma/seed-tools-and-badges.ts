/**
 * Seed Voldebug's AI tool catalog and badge definitions.
 *
 * Replaces the hardcoded DEMO_TOOLS arrays in the frontend (now removed).
 * Each tool entry has the rich content needed by /dashboard/tools/[id]:
 * description, useCases, subjects, howTo, examplePrompts, proTips, and
 * a real websiteUrl.
 *
 * Run: pnpm exec tsx prisma/seed-tools-and-badges.ts
 * Idempotent — uses upsert by `name`. Safe to re-run.
 */

import { PrismaClient, ToolCategory } from "@prisma/client";

const prisma = new PrismaClient();

interface ToolSeed {
  name: string;
  category: ToolCategory;
  description: string;
  logoUrl: string;
  brandColor: string;
  websiteUrl: string;
  useCases: string[];
  subjects: string[];
  howTo: string[];
  examplePrompts: string[];
  proTips: string[];
}

const TOOLS: ToolSeed[] = [
  {
    name: "ChatGPT",
    category: "CHAT_AI",
    description:
      "OpenAI's conversational assistant. Strong general-purpose model — great for explaining concepts, brainstorming, drafting, and Q&A.",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    brandColor: "#10a37f",
    websiteUrl: "https://chat.openai.com",
    useCases: [
      "Essay brainstorming and outlining",
      "Explaining difficult concepts in simpler terms",
      "Answering research questions",
      "Writing feedback and editing",
      "Interactive learning conversations",
    ],
    subjects: ["English", "Science", "History", "Mathematics", "Computer Science"],
    howTo: [
      "Open chat.openai.com and sign in (free account works)",
      "Click 'New chat' to start a fresh conversation",
      "Be specific in your prompt — say what you want, in what tone, how long",
      "Read the response, then ask follow-up questions to go deeper",
      "Always log your interaction in the Voldebug AI Activity Log",
    ],
    examplePrompts: [
      "Explain photosynthesis in simple terms as if I'm in Class 9.",
      "Help me create an outline for a 500-word essay on climate change.",
      "Review this paragraph and suggest 3 specific improvements: [paste]",
      "Ask me three questions to test my understanding of Newton's laws.",
    ],
    proTips: [
      "Be specific — vague prompts get vague answers",
      "Ask the AI to ASK YOU questions instead of giving you answers (Socratic mode)",
      "Always verify factual claims against your textbook or a primary source",
      "Use it to check your work, not to replace your work",
    ],
  },
  {
    name: "Claude",
    category: "CHAT_AI",
    description:
      "Anthropic's conversational AI, particularly strong at long-form analysis, structured reasoning, and following complex instructions carefully.",
    logoUrl: "https://anthropic.com/favicon.ico",
    brandColor: "#d97706",
    websiteUrl: "https://claude.ai",
    useCases: [
      "Long-form essay analysis and editing",
      "Detailed explanations of complex topics",
      "Working through multi-step problems",
      "Tutoring conversations with nuance",
    ],
    subjects: ["English", "History", "Science", "Mathematics"],
    howTo: [
      "Visit claude.ai and sign in",
      "Start a new conversation",
      "Paste your question and any relevant text — Claude handles long contexts well",
      "Iterate by asking follow-ups in the same conversation",
    ],
    examplePrompts: [
      "Compare the perspectives of Gandhi and Subhas Bose on the freedom struggle.",
      "Critique this argument for logical fallacies: [paste]",
      "Walk me through how to solve this problem step by step without giving the final answer.",
    ],
    proTips: [
      "Claude is patient with long inputs — paste full passages for analysis",
      "Ask for 'a few options' instead of 'the answer' to keep choice with you",
      "Tell Claude what age/class you're in for tone-appropriate explanations",
    ],
  },
  {
    name: "Gemini",
    category: "CHAT_AI",
    description:
      "Google's multimodal AI assistant. Tightly integrated with Google Workspace and the web; useful for research and structured outputs.",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
    brandColor: "#4285f4",
    websiteUrl: "https://gemini.google.com",
    useCases: [
      "Research with web-grounded answers",
      "Working with images and diagrams",
      "Drafting documents in your Google account",
    ],
    subjects: ["Science", "Geography", "Research", "All subjects"],
    howTo: [
      "Sign in at gemini.google.com with your Google account",
      "Type or upload (an image or doc) to start",
      "Use 'Show drafts' to see alternative responses",
    ],
    examplePrompts: [
      "Find recent news about renewable energy in India and summarise the top 3 in one paragraph each.",
      "Look at this diagram and explain what's labeled incorrectly.",
    ],
    proTips: [
      "Gemini cites sources — click them and read the original",
      "Compare its answer to ChatGPT/Claude for the same question — note the differences",
    ],
  },
  {
    name: "GitHub Copilot",
    category: "CODE_AI",
    description:
      "AI pair-programmer that suggests code as you type inside your editor. Excellent for learning syntax and common patterns.",
    logoUrl:
      "https://github.githubassets.com/assets/copilot-2c19b2bc6ddc.png",
    brandColor: "#1b1f24",
    websiteUrl: "https://github.com/features/copilot",
    useCases: [
      "Code completion as you write",
      "Suggesting how to fix bugs",
      "Learning idiomatic patterns in a new language",
    ],
    subjects: ["Computer Science"],
    howTo: [
      "Install the Copilot extension in VS Code",
      "Sign in with your GitHub account (free for students via GitHub Education)",
      "Start writing — Copilot suggests grey-text completions; press Tab to accept",
      "Read every suggestion before accepting — never accept code you can't explain",
    ],
    examplePrompts: [
      "// Function that returns the n-th Fibonacci number",
      "// TODO: handle the case where the array is empty",
    ],
    proTips: [
      "If you can't explain a Copilot suggestion in your own words, don't ship it",
      "Use it to LEARN syntax, not to skip the learning",
      "Always run and test code Copilot wrote before submitting",
    ],
  },
  {
    name: "Replit",
    category: "CODE_AI",
    description:
      "Browser-based IDE with built-in AI assistance. Great for getting started quickly without installing anything.",
    logoUrl: "https://replit.com/public/icons/favicon-196.png",
    brandColor: "#f26207",
    websiteUrl: "https://replit.com",
    useCases: [
      "Coding projects without setting up a local environment",
      "Collaborating on code with classmates in real time",
      "Learning Python, JavaScript, or web development",
    ],
    subjects: ["Computer Science"],
    howTo: [
      "Sign up at replit.com (free)",
      "Click 'Create' and pick a language template",
      "Use 'Ghostwriter' for AI suggestions while you code",
      "Click 'Run' to execute your code in the browser",
    ],
    examplePrompts: [
      "Explain what this function does line by line: [paste]",
      "What's wrong with this code? Don't fix it — just tell me where the bug is.",
    ],
    proTips: [
      "Save your work — Replit autosaves but commit major versions to a 'fork' so you can roll back",
      "Share your Repl link with your teacher when submitting code assignments",
    ],
  },
  {
    name: "Perplexity",
    category: "RESEARCH_AI",
    description:
      "AI-powered research engine that answers questions with cited sources from across the web.",
    logoUrl: "https://www.perplexity.ai/favicon.ico",
    brandColor: "#20b2aa",
    websiteUrl: "https://www.perplexity.ai",
    useCases: [
      "Research assignments where you need to cite sources",
      "Fact-checking AI answers from other tools",
      "Finding starting points for deeper reading",
    ],
    subjects: ["Science", "History", "Geography", "Research"],
    howTo: [
      "Visit perplexity.ai (no account required for basic use)",
      "Type your question in natural language",
      "Read the answer — every claim has a numbered citation",
      "Click each citation to open the source and verify",
    ],
    examplePrompts: [
      "What were the main causes of the 1857 revolt in India?",
      "What is the current status of the Ganga river clean-up project?",
    ],
    proTips: [
      "ALWAYS click through to at least one citation before believing an answer",
      "Use Perplexity for the bibliography, not the final words",
    ],
  },
  {
    name: "Grammarly",
    category: "WRITING_AI",
    description:
      "Real-time writing assistant that flags grammar, clarity, and tone issues across the web and in your documents.",
    logoUrl: "https://static.grammarly.com/assets/files/grammarly-logo.svg",
    brandColor: "#15c39a",
    websiteUrl: "https://www.grammarly.com",
    useCases: [
      "Catching grammar and spelling mistakes",
      "Improving sentence clarity and tone",
      "Polishing essays before submitting",
    ],
    subjects: ["English", "All subjects"],
    howTo: [
      "Install the Grammarly browser extension or app",
      "Write in any text box — Grammarly underlines issues",
      "Hover over each underline to see the suggestion",
      "Decide whether to accept or skip — the AI is wrong sometimes too",
    ],
    examplePrompts: ["(Grammarly works on whatever you write — there's no prompt.)"],
    proTips: [
      "Don't accept every suggestion blindly — Grammarly often kills your voice",
      "Use the 'Tone detector' to make sure your essay reads the way you want",
    ],
  },
  {
    name: "QuillBot",
    category: "WRITING_AI",
    description:
      "Paraphrasing and summarising tool. Useful for shortening long passages and finding alternative phrasings.",
    logoUrl: "https://quillbot.com/favicon.ico",
    brandColor: "#4caf50",
    websiteUrl: "https://quillbot.com",
    useCases: [
      "Summarising long articles",
      "Finding alternative ways to phrase your own writing",
      "Paraphrasing source material into your own words",
    ],
    subjects: ["English", "All subjects"],
    howTo: [
      "Go to quillbot.com",
      "Paste your text",
      "Pick a mode (Standard, Fluency, Formal, etc.)",
      "Edit the output until it matches your voice",
    ],
    examplePrompts: ["Paste any paragraph and click 'Paraphrase'"],
    proTips: [
      "Paraphrasing isn't citing — you still need to credit the original source",
      "Read the output aloud — if it doesn't sound like you, rewrite it",
    ],
  },
  {
    name: "Canva AI",
    category: "IMAGE_AI",
    description:
      "Design tool with built-in AI image generation, background remover, and Magic Write for posters, presentations, and infographics.",
    logoUrl: "https://static.canva.com/static/images/icons/favicon-196x196.png",
    brandColor: "#00c4cc",
    websiteUrl: "https://www.canva.com",
    useCases: [
      "Class presentations",
      "Posters for school projects",
      "Infographics that summarise topics visually",
    ],
    subjects: ["Art", "Business Studies", "All subjects"],
    howTo: [
      "Sign in at canva.com (free with school email)",
      "Choose a template (Presentation, Poster, etc.)",
      "Use 'Magic Media' to generate images from a description",
      "Use 'Magic Write' for text content",
    ],
    examplePrompts: [
      "Generate an image of a labelled plant cell, watercolour style.",
      "Write a 4-bullet summary of the water cycle for a poster.",
    ],
    proTips: [
      "AI-generated images often have wrong details — always check anatomy/labels against your textbook",
      "Cite which AI you used in your project's notes",
    ],
  },
  {
    name: "Khan Academy Khanmigo",
    category: "RESEARCH_AI",
    description:
      "Khan Academy's AI tutor. Asks questions in a Socratic style instead of giving direct answers — designed specifically for learning.",
    logoUrl: "https://cdn.kastatic.org/images/khan-logo-vertical-transparent.png",
    brandColor: "#14bf96",
    websiteUrl: "https://www.khanmigo.ai",
    useCases: [
      "Working through math problems step by step",
      "Getting hints when stuck without giving up the answer",
      "Discussing literature and history texts",
    ],
    subjects: ["Mathematics", "Science", "English", "History"],
    howTo: [
      "Sign up at khanmigo.ai",
      "Pick a topic or paste a problem",
      "Khanmigo will ask you questions instead of solving the problem for you",
      "Take the questions seriously — that's where the learning happens",
    ],
    examplePrompts: [
      "I'm stuck on this quadratic equation: x² - 5x + 6 = 0. Help me figure it out.",
    ],
    proTips: [
      "Khanmigo is designed to make you do the thinking — let it",
      "When it asks a question, answer in writing before reading the next message",
    ],
  },
];

interface BadgeSeed {
  name: string;
  description: string;
  iconUrl: string;
  conditionKey: string;
  requiredCount: number;
  xpReward: number;
}

const BADGES: BadgeSeed[] = [
  {
    name: "First Step",
    description: "Submitted your first assignment.",
    iconUrl: "📤",
    conditionKey: "first_assignment",
    requiredCount: 1,
    xpReward: 100,
  },
  {
    name: "Tool Explorer",
    description: "Used 5 different AI tools.",
    iconUrl: "🔭",
    conditionKey: "used_5_tools",
    requiredCount: 5,
    xpReward: 150,
  },
  {
    name: "Streak Master",
    description: "Maintained a 7-day login streak.",
    iconUrl: "⚡",
    conditionKey: "streak_7",
    requiredCount: 7,
    xpReward: 200,
  },
  {
    name: "Top Scholar",
    description: "Reached #1 on the class leaderboard.",
    iconUrl: "🏆",
    conditionKey: "rank_1",
    requiredCount: 1,
    xpReward: 300,
  },
  {
    name: "Transparent Thinker",
    description: "Logged 10 AI interactions to your Activity Log.",
    iconUrl: "🔍",
    conditionKey: "logged_10_ai",
    requiredCount: 10,
    xpReward: 200,
  },
  {
    name: "Ethical Operator",
    description: "Maintained a clean (zero-flag) AI integrity record across 20 interactions.",
    iconUrl: "🛡️",
    conditionKey: "clean_20_ai",
    requiredCount: 20,
    xpReward: 350,
  },
];

async function main() {
  console.log(`Seeding ${TOOLS.length} tools…`);
  for (const t of TOOLS) {
    // Tool model has no @unique on name in Prisma, but practically names
    // ARE unique here. We do find-then-update/create rather than upsert
    // to keep the script working without a schema change.
    const existing = await prisma.tool.findFirst({ where: { name: t.name } });
    if (existing) {
      await prisma.tool.update({
        where: { id: existing.id },
        data: t,
      });
    } else {
      await prisma.tool.create({ data: t });
    }
    console.log(`  ✓ ${t.name}`);
  }

  console.log(`Seeding ${BADGES.length} badges…`);
  for (const b of BADGES) {
    const existing = await prisma.badge.findFirst({
      where: { conditionKey: b.conditionKey },
    });
    if (existing) {
      await prisma.badge.update({ where: { id: existing.id }, data: b });
    } else {
      await prisma.badge.create({ data: b });
    }
    console.log(`  ✓ ${b.name}`);
  }

  // ── Wire seeded lesson plans to suggested tools where it makes sense
  console.log("Linking lesson plans to suggested tools…");
  const linkages: { slug: string; toolName: string }[] = [
    { slug: "class-9-science-force-laws-of-motion", toolName: "ChatGPT" },
    { slug: "class-10-history-nationalism-in-india", toolName: "Perplexity" },
    { slug: "class-8-english-ai-as-writing-partner", toolName: "Claude" },
    { slug: "class-10-math-quadratic-equations", toolName: "Khan Academy Khanmigo" },
    { slug: "class-11-biology-cell-the-unit-of-life", toolName: "Canva AI" },
  ];
  for (const link of linkages) {
    const tool = await prisma.tool.findFirst({ where: { name: link.toolName } });
    const plan = await prisma.lessonPlan.findUnique({ where: { slug: link.slug } });
    if (tool && plan) {
      await prisma.lessonPlan.update({
        where: { id: plan.id },
        data: { suggestedToolId: tool.id },
      });
      console.log(`  ✓ ${link.slug} → ${link.toolName}`);
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
