import { z } from "zod";

// An AI activity step shown to the student during the lesson.
const aiActivitySchema = z.object({
  step: z.number().int().min(1).max(20),
  instruction: z.string().min(1).max(2000),
  suggestedPrompt: z.string().max(2000).default(""),
  expectedLearning: z.string().max(1000),
  timeMinutes: z.number().int().min(1).max(300),
});

const resourceSchema = z.object({
  type: z.enum(["link", "pdf", "video"]),
  title: z.string().min(1).max(200),
  url: z.string().url(),
});

const rubricCriterionSchema = z.object({
  name: z.string().min(1).max(200),
  weight: z.number().int().min(1).max(100),
  descriptors: z.object({
    excellent: z.string().min(1),
    good: z.string().min(1),
    needs_work: z.string().min(1),
  }),
});

export const createLessonPlanSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  title: z.string().min(3).max(200),
  summary: z.string().min(10).max(2000),
  subject: z.string().min(2).max(60),
  gradeLevel: z.number().int().min(1).max(12),
  board: z.string().min(2).max(40),
  chapter: z.string().max(200).optional(),
  chapterNumber: z.number().int().min(1).max(50).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  durationMinutes: z.number().int().min(5).max(300).default(45),
  learningObjectives: z.array(z.string().min(1).max(500)).min(1).max(12),
  aiActivities: z.array(aiActivitySchema).min(1).max(20),
  resources: z.array(resourceSchema).max(20).optional(),
  rubricTemplate: z
    .object({ criteria: z.array(rubricCriterionSchema).min(1).max(10) })
    .optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const listFiltersSchema = z.object({
  subject: z.string().optional(),
  gradeLevel: z.coerce.number().int().min(1).max(12).optional(),
  board: z.string().optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateLessonPlanInput = z.infer<typeof createLessonPlanSchema>;
export type ListFiltersInput = z.infer<typeof listFiltersSchema>;
