import { z } from "zod";

export const promptKindSchema = z.enum([
  "EXPLORE",
  "VERIFY",
  "FEEDBACK",
  "REFLECT",
  "PRACTICE",
  "SUMMARIZE",
]);

export const createPromptSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  title: z.string().min(3).max(200),
  prompt: z.string().min(5).max(4000),
  description: z.string().min(5).max(1000),
  subject: z.string().min(2).max(60),
  gradeLevel: z.number().int().min(1).max(12),
  board: z.string().min(2).max(40),
  chapter: z.string().max(200).optional(),
  chapterNumber: z.number().int().min(1).max(50).optional(),
  topic: z.string().max(200).optional(),
  kind: promptKindSchema.default("EXPLORE"),
  recommendedToolId: z.string().min(1).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const promptListFiltersSchema = z.object({
  subject: z.string().optional(),
  gradeLevel: z.coerce.number().int().min(1).max(12).optional(),
  board: z.string().optional(),
  chapter: z.string().optional(),
  toolId: z.string().optional(),
  kind: promptKindSchema.optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type PromptListFilters = z.infer<typeof promptListFiltersSchema>;
