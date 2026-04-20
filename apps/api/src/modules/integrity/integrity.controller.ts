import type { Request, Response } from "express";
import { z } from "zod";
import { apiSuccess, apiError } from "../../utils/api.js";
import { prisma } from "../../utils/prisma.js";
import { captureAiInteraction, getMyAiHistory } from "./integrity.service.js";
import { FLAG_DESCRIPTIONS } from "./integrity.rules.js";

// ── Student: log an AI interaction ────────────────────────────────────────

const logSchema = z.object({
  promptText: z.string().min(1).max(20000),
  aiResponse: z.string().min(1).max(60000),
  toolUsed: z.string().min(1).max(80),
  assignmentId: z.string().min(1).optional(),
  source: z.enum(["manual_paste", "voldebug_chat", "browser_ext"]).optional(),
});

export async function handleLogAiInteraction(req: Request, res: Response) {
  const userId = req.userId!;
  const parsed = logSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid AI log payload",
      status: 422,
    });
  }
  try {
    const created = await captureAiInteraction({
      studentId: userId,
      ...parsed.data,
    });
    return apiSuccess(
      res,
      {
        ...created,
        // Echo back human-readable reasons so the student understands
        // what's being flagged on their behaviour. Transparency builds
        // trust and discourages cheating better than secret monitoring.
        flagDescriptions: created.flagReasons.map(
          (r) => FLAG_DESCRIPTIONS[r as keyof typeof FLAG_DESCRIPTIONS] ?? r,
        ),
      },
      201,
    );
  } catch (err) {
    return apiError(res, {
      code: "LOG_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}

// ── Student: own history ─────────────────────────────────────────────────

export async function handleGetMyAiHistory(req: Request, res: Response) {
  const userId = req.userId!;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  try {
    const result = await getMyAiHistory({ studentId: userId, page, limit });
    return apiSuccess(res, result, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to load AI history",
      status: 500,
    });
  }
}

// ── Teacher: integrity report for a single submission ────────────────────
// Returns: the submission, all AI interactions for this student linked
// to that assignment, plus all-time recent activity for context.

export async function handleSubmissionIntegrity(req: Request, res: Response) {
  const teacherId = req.userId!;
  const { submissionId } = req.params;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignment: { include: { class: { select: { teacherId: true } } } },
      },
    });

    if (!submission) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Submission not found",
        status: 404,
      });
    }
    if (submission.assignment.class.teacherId !== teacherId) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Only the class teacher can view integrity for this submission",
        status: 403,
      });
    }

    const [interactionsForAssignment, allFlagsForStudent] = await Promise.all([
      // AI activity tied to THIS assignment.
      prisma.auditLog.findMany({
        where: {
          studentId: submission.studentId,
          assignmentId: submission.assignmentId,
        },
        orderBy: { timestamp: "desc" },
        select: {
          id: true,
          toolUsed: true,
          promptText: true,
          aiResponse: true,
          flagReasons: true,
          isFlagged: true,
          promptLength: true,
          responseLength: true,
          source: true,
          timestamp: true,
        },
      }),
      // All-time flagged interactions for this student — context the
      // teacher uses to decide if it's a one-off or a pattern.
      prisma.auditLog.count({
        where: { studentId: submission.studentId, isFlagged: true },
      }),
    ]);

    return apiSuccess(res, {
      submission: {
        id: submission.id,
        student: submission.student,
        assignmentId: submission.assignmentId,
        assignmentTitle: submission.assignment.title,
        submittedAt: submission.submittedAt,
        score: submission.score,
        grade: submission.grade,
      },
      aiInteractions: interactionsForAssignment.map((log) => ({
        ...log,
        flagDescriptions: log.flagReasons.map(
          (r) => FLAG_DESCRIPTIONS[r as keyof typeof FLAG_DESCRIPTIONS] ?? r,
        ),
      })),
      stats: {
        interactionsForAssignment: interactionsForAssignment.length,
        flaggedForAssignment: interactionsForAssignment.filter((i) => i.isFlagged).length,
        flaggedAllTimeForStudent: allFlagsForStudent,
      },
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to build integrity report",
      status: 500,
    });
  }
}

// ── Teacher: class-wide integrity feed (flagged-only) ────────────────────

export async function handleClassIntegrityFeed(req: Request, res: Response) {
  const teacherId = req.userId!;
  const { classId } = req.params;
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 30), 100);
  const skip = (page - 1) * limit;

  try {
    // Confirm the teacher owns the class.
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { teacherId: true },
    });
    if (!cls || cls.teacherId !== teacherId) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "You do not teach this class",
        status: 403,
      });
    }

    // Students in this class
    const memberIds = (
      await prisma.classMember.findMany({
        where: { classId },
        select: { userId: true },
      })
    ).map((m) => m.userId);

    if (memberIds.length === 0) {
      return apiSuccess(res, { logs: [], total: 0 }, 200, {
        page,
        limit,
        total: 0,
      });
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          studentId: { in: memberIds },
          isFlagged: true,
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          toolUsed: true,
          promptText: true,
          flagReasons: true,
          promptLength: true,
          responseLength: true,
          timestamp: true,
          student: { select: { id: true, name: true, email: true } },
          assignment: { select: { id: true, title: true } },
        },
      }),
      prisma.auditLog.count({
        where: { studentId: { in: memberIds }, isFlagged: true },
      }),
    ]);

    return apiSuccess(
      res,
      {
        logs: logs.map((log) => ({
          ...log,
          flagDescriptions: log.flagReasons.map(
            (r) => FLAG_DESCRIPTIONS[r as keyof typeof FLAG_DESCRIPTIONS] ?? r,
          ),
        })),
        total,
      },
      200,
      { page, limit, total },
    );
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to load class integrity feed",
      status: 500,
    });
  }
}
