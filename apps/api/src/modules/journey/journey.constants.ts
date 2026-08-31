// Journey (SPA) gamification constants.
//
// These mirror the constants in apps/spa/src/app.js — the SPA shows the same
// numbers optimistically, but the server is the ledger of record. If you
// change a value here, change it in the SPA too or the optimistic UI drifts
// until the next hydrate.

export const XP_TABLE = {
  tool: 75,
  quizPass: 120,
  quizPerfect: 80, // bonus on top of quizPass when pct === 100
  quest: 200,
  onboard: 50,
  avatar: 25,
  classJoin: 100,
  curriculumPrompt: 60,
  promptBuilt: 40,
  creation: 90,
  starterStep: 60,
  upskillModule: 150,
} as const;

// Anti-farm daily caps for repeatable actions (server-side only; the SPA has
// no equivalent because localStorage was never trusted anyway).
export const PROMPT_BUILT_DAILY_CAP = 10;
export const CREATION_XP_DAILY_CAP = 5;

// Triangular XP curve: xpForLevel(L) = 25·L·(L−1), capped at level 50.
const C = 25;
export const MAX_LEVEL = 50;

export function levelForXp(xp: number): number {
  if (xp <= 0) return 1;
  return Math.max(
    1,
    Math.min(MAX_LEVEL, Math.floor((C + Math.sqrt(C * C + 4 * C * xp)) / (2 * C))),
  );
}

// SPA tool catalog: slug → category. Used only for the category-explorer
// badge (distinct categories among toolsSeen). Unknown slugs are rejected
// at validation time so the sets can't be polluted.
export const TOOL_CATEGORIES: Record<string, string> = {
  chatgpt: "learning-research",
  claude: "learning-research",
  gemini: "learning-research",
  "canva-ai": "image-ai",
  notebooklm: "learning-research",
  perplexity: "learning-research",
  suno: "game-making",
  runway: "video-ai",
  khanmigo: "learning-research",
  "chatgpt-junior": "learning-research",
  "gemini-junior": "learning-research",
  copilot: "vibe-coding",
  "notion-ai": "learning-research",
  "bolt-new": "vibe-coding",
  lovable: "vibe-coding",
  "replit-ai": "vibe-coding",
  "v0-vercel": "vibe-coding",
  "base44-ai": "vibe-coding",
  "cursor-ai": "vibe-coding",
  "windsurf-ai": "vibe-coding",
  "claude-code": "vibe-coding",
  "adobe-express": "image-ai",
  midjourney: "image-ai",
  "ideogram-ai": "image-ai",
  "leonardo-ai": "image-ai",
  "dalle-chatgpt": "image-ai",
  "stable-diffusion": "image-ai",
  "recraft-ai": "image-ai",
  "freepik-ai": "image-ai",
  "ms-designer": "image-ai",
  "capcut-ai": "video-ai",
  "pika-labs": "video-ai",
  "luma-dream": "video-ai",
  "kling-ai": "video-ai",
  "google-veo": "video-ai",
  "invideo-ai": "video-ai",
  "hailuo-ai": "video-ai",
  "wolfram-alpha": "learning-research",
  "elicit-ai": "learning-research",
  "consensus-ai": "learning-research",
  "quizlet-ai": "learning-research",
  "otter-ai": "learning-research",
  "grammarly-ai": "learning-research",
  "scratch-ai": "game-making",
  "rosebud-ai": "game-making",
  "roblox-studio": "game-making",
  "gdevelop-ai": "game-making",
  "buildbox-ai": "game-making",
  "teachable-machine": "gesture-ai",
  mediapipe: "gesture-ai",
  "leap-motion": "gesture-ai",
  wekinator: "gesture-ai",
};

export const STARTER_STEP_KEYS = [
  "explore",
  "quiz",
  "chapter",
  "prompt",
  "creation",
] as const;

export const PROMPT_TEMPLATE_KEYS = [
  "slides",
  "diagram",
  "image",
  "mindmap",
  "video",
  "quiz",
] as const;

export const UPSKILL_MODULE_KEYS = [
  "prompting-basics",
  "lesson-planning-ai",
  "ai-ethics-classroom",
] as const;

export const JOURNEY_ROLES = ["student", "teacher", "principal", "parent"] as const;
export const CLASS_GROUPS = ["junior", "middle", "senior"] as const;

// Badge evaluation context, derived entirely from the profile row + creation
// count. Conditions are pure functions so they're trivially unit-testable.
export interface BadgeCtx {
  tools: number;
  mastered: number; // toolScores >= 80
  perfect: number; // toolScores === 100
  streak: number;
  level: number;
  quests: number;
  inClass: boolean;
  chapters: number;
  catsUsed: number;
  promptTemplates: number;
  creations: number;
  starter: number;
}

export const BADGES: { key: string; label: string; need: (c: BadgeCtx) => boolean }[] = [
  { key: "first-prompt", label: "First Prompt", need: (c) => c.tools >= 1 },
  { key: "toolbelt", label: "Toolbelt", need: (c) => c.tools >= 5 },
  { key: "spark", label: "Spark", need: (c) => c.streak >= 3 },
  { key: "quiz-ace", label: "Quiz Ace", need: (c) => c.mastered >= 1 },
  { key: "week-warrior", label: "Week Warrior", need: (c) => c.streak >= 7 },
  { key: "level-10", label: "Level 10", need: (c) => c.level >= 10 },
  { key: "classmate", label: "Classmate", need: (c) => c.inClass },
  { key: "perfect", label: "Perfectionist", need: (c) => c.perfect >= 3 },
  { key: "quest-runner", label: "Quest Runner", need: (c) => c.quests >= 10 },
  { key: "level-20", label: "Level 20", need: (c) => c.level >= 20 },
  { key: "polyglot", label: "Polyglot", need: (c) => c.mastered >= 6 },
  { key: "unstoppable", label: "Unstoppable", need: (c) => c.streak >= 30 },
  { key: "curriculum-first", label: "Curriculum First", need: (c) => c.chapters >= 1 },
  { key: "curriculum-five", label: "Curriculum Five", need: (c) => c.chapters >= 5 },
  { key: "category-explorer", label: "Category Explorer", need: (c) => c.catsUsed >= 4 },
  { key: "prompt-starter", label: "Prompt Starter", need: (c) => c.promptTemplates >= 1 },
  { key: "prompt-sixpack", label: "Prompt Sixpack", need: (c) => c.promptTemplates >= 6 },
  { key: "first-creation", label: "First Creation", need: (c) => c.creations >= 1 },
  { key: "portfolio-five", label: "Portfolio Five", need: (c) => c.creations >= 5 },
  { key: "first-week", label: "First Week", need: (c) => c.starter >= 5 },
];
