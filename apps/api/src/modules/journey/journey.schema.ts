import { z } from "zod";
import {
  CLASS_GROUPS,
  JOURNEY_ROLES,
  PROMPT_TEMPLATE_KEYS,
  STARTER_STEP_KEYS,
  TOOL_CATEGORIES,
  UPSKILL_MODULE_KEYS,
} from "./journey.constants.js";

const toolSlug = z
  .string()
  .max(64)
  .refine((s) => s in TOOL_CATEGORIES, { message: "Unknown tool slug" });

// Mirrors AVATARS in apps/spa/src/app.js. Enum (not free string) because the
// SPA renders avatar keys into markup unescaped in a few places.
const avatarKey = z.enum(["fox", "robot", "owl", "panda", "cat", "rocket", "alien", "dino"]);

// One classCode rule for every path that can set it (event + onboard).
const classCode = z.string().min(4).max(12).regex(/^[a-z0-9-]+$/i);

// Chapter slugs are curriculum data the SPA owns; the server just needs them
// bounded and shaped like slugs so the array can't be polluted with garbage.
const chapterSlug = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/i);

export const eventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("tool_explored"), payload: z.object({ slug: toolSlug }) }),
  z.object({
    kind: z.literal("quiz_completed"),
    payload: z.object({ slug: toolSlug, pct: z.number().int().min(0).max(100) }),
  }),
  z.object({ kind: z.literal("quest_completed"), payload: z.object({}).default({}) }),
  z.object({
    kind: z.literal("curriculum_prompt"),
    payload: z.object({ chapterSlug, title: z.string().max(200).optional() }),
  }),
  z.object({
    kind: z.literal("prompt_built"),
    payload: z.object({ tplKey: z.enum(PROMPT_TEMPLATE_KEYS) }),
  }),
  z.object({
    kind: z.literal("starter_step"),
    payload: z.object({ key: z.enum(STARTER_STEP_KEYS) }),
  }),
  z.object({
    kind: z.literal("upskill_module"),
    payload: z.object({ key: z.enum(UPSKILL_MODULE_KEYS) }),
  }),
  z.object({
    kind: z.literal("class_join"),
    payload: z.object({ code: classCode }),
  }),
  z.object({
    kind: z.literal("avatar_set"),
    payload: z.object({ avatar: avatarKey }),
  }),
  z.object({
    kind: z.literal("settings"),
    payload: z.object({ locale: z.enum(["en", "hi"]).optional() }),
  }),
]);

export type JourneyEventInput = z.infer<typeof eventSchema>;

export const eventsBodySchema = z.object({
  events: z.array(eventSchema).min(1).max(20),
});

export const onboardSchema = z.object({
  journeyRole: z.enum(JOURNEY_ROLES),
  classGroup: z.enum(CLASS_GROUPS).optional(),
  avatar: avatarKey.optional(),
  locale: z.enum(["en", "hi"]).optional(),
  classCode: classCode.optional().or(z.literal("").transform(() => undefined)),
  name: z.string().min(1).max(80).optional(),
});

export const creationSchema = z.object({
  title: z.string().min(1).max(120),
  tool: z.string().min(1).max(64),
  link: z.string().url().max(500).optional().or(z.literal("")),
  note: z.string().max(1000).optional(),
  emoji: z.string().max(8).optional(),
});

export const classCreateSchema = z.object({
  name: z.string().min(1).max(60),
  classGroup: z.enum(CLASS_GROUPS).optional(),
});

export const classCodeParamSchema = classCode;
