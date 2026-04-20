import { z } from "zod";

// Submission file URLs are bounded so a single submission can't blow past
// the storage budget. The presigned-URL flow (commit D) will additionally
// verify that each URL points to our own bucket.
const fileUrlSchema = z
  .string()
  .url()
  .max(2048, "File URL too long");

export const createSubmissionSchema = z.object({
  assignmentId: z.string().min(1, "assignmentId is required"),
  fileUrls: z
    .array(fileUrlSchema)
    .min(1, "At least one file is required")
    .max(20, "Too many files (max 20)"),
  studentNotes: z.string().max(5000).optional(),
});

// Grade input is the raw teacher-provided score and qualitative bits.
// XP is intentionally NOT in this schema — the server computes it from
// `score` (see computeGradeXp in submissions.service.ts). CLAUDE.md §4.7.
export const gradeSubmissionSchema = z.object({
  score: z.number().int().min(0).max(100),
  grade: z
    .enum(["A+", "A", "B+", "B", "C+", "C", "D", "F"])
    .optional(),
  feedback: z.string().max(5000).optional(),
  // Optional teacher quality bonus, capped to prevent abuse.
  teacherBonusXp: z.number().int().min(0).max(50).optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
