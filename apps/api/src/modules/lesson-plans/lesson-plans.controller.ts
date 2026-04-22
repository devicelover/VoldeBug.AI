import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import {
  createLessonPlanSchema,
  listFiltersSchema,
} from "./lesson-plans.schema.js";

// ─── List with filters ────────────────────────────────────────────────────

export async function handleListLessonPlans(req: Request, res: Response) {
  const parsed = listFiltersSchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid filters",
      status: 422,
    });
  }
  const { subject, gradeLevel, board, q, page, limit } = parsed.data;

  const where: Prisma.LessonPlanWhereInput = {
    isPublic: true,
    deletedAt: null,
  };
  if (subject) where.subject = subject;
  if (gradeLevel) where.gradeLevel = gradeLevel;
  if (board) where.board = board;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { chapter: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
    ];
  }

  try {
    const [plans, total] = await Promise.all([
      prisma.lessonPlan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { isOfficial: "desc" }, // Voldebug-vetted first
          { usageCount: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          subject: true,
          gradeLevel: true,
          board: true,
          chapter: true,
          chapterNumber: true,
          difficulty: true,
          durationMinutes: true,
          tags: true,
          isOfficial: true,
          usageCount: true,
          suggestedTool: {
            select: { id: true, name: true, brandColor: true, logoUrl: true },
          },
          createdAt: true,
        },
      }),
      prisma.lessonPlan.count({ where }),
    ]);

    // Also return the unique facet values so the UI can populate filter
    // menus without a second round-trip.
    const facets = await prisma.lessonPlan.findMany({
      where: { isPublic: true, deletedAt: null },
      select: { subject: true, gradeLevel: true, board: true },
      distinct: ["subject", "gradeLevel", "board"],
    });

    return apiSuccess(
      res,
      {
        plans,
        total,
        facets: {
          subjects: Array.from(new Set(facets.map((f) => f.subject))).sort(),
          gradeLevels: Array.from(new Set(facets.map((f) => f.gradeLevel))).sort(
            (a, b) => a - b,
          ),
          boards: Array.from(new Set(facets.map((f) => f.board))).sort(),
        },
      },
      200,
      { page, limit, total },
    );
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to list lesson plans",
      status: 500,
    });
  }
}

// ─── Get one ──────────────────────────────────────────────────────────────

export async function handleGetLessonPlan(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  try {
    const plan = await prisma.lessonPlan.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isPublic: true,
        deletedAt: null,
      },
      include: {
        suggestedTool: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    if (!plan) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Lesson plan not found",
        status: 404,
      });
    }
    return apiSuccess(res, plan);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch lesson plan",
      status: 500,
    });
  }
}

// ─── Teacher: create ──────────────────────────────────────────────────────

export async function handleCreateLessonPlan(req: Request, res: Response) {
  const userId = req.userId!;
  const parsed = createLessonPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid payload",
      status: 422,
    });
  }
  const data = parsed.data;

  try {
    const plan = await prisma.lessonPlan.create({
      data: {
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        subject: data.subject,
        gradeLevel: data.gradeLevel,
        board: data.board,
        chapter: data.chapter,
        chapterNumber: data.chapterNumber,
        difficulty: data.difficulty,
        durationMinutes: data.durationMinutes,
        learningObjectives: data.learningObjectives,
        aiActivities: data.aiActivities as unknown as Prisma.InputJsonValue,
        resources: (data.resources ?? []) as unknown as Prisma.InputJsonValue,
        rubricTemplate: data.rubricTemplate
          ? (data.rubricTemplate as unknown as Prisma.InputJsonValue)
          : undefined,
        tags: data.tags,
        authorId: userId,
        isOfficial: false,
      },
    });
    return apiSuccess(res, plan, 201);
  } catch (err) {
    const msg = (err as Error).message.includes("Unique constraint")
      ? "A plan with that slug already exists"
      : (err as Error).message;
    return apiError(res, {
      code: "CREATE_FAILED",
      message: msg,
      status: 400,
    });
  }
}

// ─── Teacher: soft-delete own plan ───────────────────────────────────────
// Plans authored by Voldebug faculty (authorId == null, isOfficial=true)
// can only be removed by a system admin via the DB; teachers can't delete
// them. This protects the seeded library.

export async function handleDeleteLessonPlan(req: Request, res: Response) {
  const userId = req.userId!;
  const userRole = req.userRole!;
  const { id } = req.params;
  try {
    const plan = await prisma.lessonPlan.findUnique({
      where: { id },
      select: { id: true, authorId: true, isOfficial: true },
    });
    if (!plan) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Lesson plan not found",
        status: 404,
      });
    }
    // Teachers can only delete their own. Admins can delete anything in
    // their school. Official seeded plans are protected from teacher
    // deletion to keep the library stable.
    const isOwner = plan.authorId === userId;
    const isAdmin = userRole === "ADMIN";
    if (!isOwner && !isAdmin) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "You can only delete plans you authored",
        status: 403,
      });
    }
    if (plan.isOfficial && !isAdmin) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Official Voldebug plans can't be deleted by teachers",
        status: 403,
      });
    }
    await prisma.lessonPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return apiSuccess(res, { id });
  } catch (err) {
    return apiError(res, {
      code: "DELETE_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}

// ─── Teacher: mark as "used" (bump counter, return prefill payload) ──────

export async function handleMarkLessonPlanUsed(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const plan = await prisma.lessonPlan.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
      include: { suggestedTool: true },
    });

    // Build an assignment-create payload from the plan. The UI uses this
    // to prefill the Create Assignment form. Due date defaults to 7 days
    // from now — teacher can override.
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const aiActivities = plan.aiActivities as unknown as Array<{
      step: number;
      instruction: string;
      suggestedPrompt: string;
      expectedLearning: string;
      timeMinutes: number;
    }>;
    const instructionsBody = aiActivities
      .map(
        (a) =>
          `Step ${a.step} (${a.timeMinutes} min): ${a.instruction}${
            a.suggestedPrompt
              ? `\nSuggested prompt: ${a.suggestedPrompt}`
              : ""
          }`,
      )
      .join("\n\n");

    return apiSuccess(res, {
      plan,
      assignmentPrefill: {
        title: plan.title,
        description: `${plan.summary}\n\n---\n\n${instructionsBody}`,
        dueDate: dueDate.toISOString(),
        suggestedToolId: plan.suggestedToolId,
        xpReward: 50,
        earlyBonus: 25,
      },
    });
  } catch {
    return apiError(res, {
      code: "NOT_FOUND",
      message: "Lesson plan not found",
      status: 404,
    });
  }
}
