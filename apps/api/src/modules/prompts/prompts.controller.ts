import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import {
  createPromptSchema,
  promptListFiltersSchema,
} from "./prompts.schema.js";

// ─── List with filters + facets ──────────────────────────────────────────

export async function handleListPrompts(req: Request, res: Response) {
  const parsed = promptListFiltersSchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid filters",
      status: 422,
    });
  }
  const { subject, gradeLevel, board, chapter, toolId, kind, q, page, limit } =
    parsed.data;

  const where: Prisma.PromptRecipeWhereInput = {
    isPublic: true,
    deletedAt: null,
  };
  if (subject) where.subject = subject;
  if (gradeLevel) where.gradeLevel = gradeLevel;
  if (board) where.board = board;
  if (chapter) where.chapter = chapter;
  if (toolId) where.recommendedToolId = toolId;
  if (kind) where.kind = kind;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { prompt: { contains: q, mode: "insensitive" } },
      { chapter: { contains: q, mode: "insensitive" } },
      { topic: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
    ];
  }

  try {
    const [prompts, total] = await Promise.all([
      prisma.promptRecipe.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { isOfficial: "desc" }, // Voldebug-vetted first
          { copyCount: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          recommendedTool: {
            select: {
              id: true,
              name: true,
              brandColor: true,
              category: true,
              websiteUrl: true,
            },
          },
        },
      }),
      prisma.promptRecipe.count({ where }),
    ]);

    // Facets — single round-trip so the UI can populate filter menus
    // without a second query.
    const facetRows = await prisma.promptRecipe.findMany({
      where: { isPublic: true, deletedAt: null },
      select: { subject: true, gradeLevel: true, board: true, chapter: true },
      distinct: ["subject", "gradeLevel", "board", "chapter"],
    });

    return apiSuccess(
      res,
      {
        prompts,
        total,
        facets: {
          subjects: Array.from(new Set(facetRows.map((f) => f.subject))).sort(),
          gradeLevels: Array.from(
            new Set(facetRows.map((f) => f.gradeLevel)),
          ).sort((a, b) => a - b),
          boards: Array.from(new Set(facetRows.map((f) => f.board))).sort(),
          chapters: Array.from(
            new Set(facetRows.map((f) => f.chapter).filter((c): c is string => !!c)),
          ).sort(),
        },
      },
      200,
      { page, limit, total },
    );
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to list prompts",
      status: 500,
    });
  }
}

// ─── Get one ─────────────────────────────────────────────────────────────

export async function handleGetPrompt(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  try {
    const p = await prisma.promptRecipe.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isPublic: true,
        deletedAt: null,
      },
      include: {
        recommendedTool: true,
      },
    });
    if (!p) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Prompt not found",
        status: 404,
      });
    }
    return apiSuccess(res, p);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch prompt",
      status: 500,
    });
  }
}

// ─── Create (TEACHER + ADMIN) ────────────────────────────────────────────

export async function handleCreatePrompt(req: Request, res: Response) {
  const userId = req.userId!;
  const parsed = createPromptSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid prompt",
      status: 422,
    });
  }
  try {
    const data = parsed.data;
    const created = await prisma.promptRecipe.create({
      data: {
        ...data,
        authorId: userId,
        isOfficial: false,
      },
    });
    return apiSuccess(res, created, 201);
  } catch (err) {
    const m = (err as Error).message.includes("Unique constraint")
      ? "A prompt with that slug already exists"
      : (err as Error).message;
    return apiError(res, {
      code: "CREATE_FAILED",
      message: m,
      status: 400,
    });
  }
}

// ─── Bump usage / copy counters ──────────────────────────────────────────

export async function handleMarkPromptUsed(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.promptRecipe.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
    return apiSuccess(res, { id });
  } catch {
    return apiError(res, {
      code: "NOT_FOUND",
      message: "Prompt not found",
      status: 404,
    });
  }
}

export async function handleMarkPromptCopied(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.promptRecipe.update({
      where: { id },
      data: { copyCount: { increment: 1 } },
    });
    return apiSuccess(res, { id });
  } catch {
    return apiError(res, {
      code: "NOT_FOUND",
      message: "Prompt not found",
      status: 404,
    });
  }
}

// ─── Delete (owner OR admin, not official) ──────────────────────────────

export async function handleDeletePrompt(req: Request, res: Response) {
  const userId = req.userId!;
  const userRole = req.userRole!;
  const { id } = req.params;
  try {
    const p = await prisma.promptRecipe.findUnique({
      where: { id },
      select: { authorId: true, isOfficial: true },
    });
    if (!p) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Prompt not found",
        status: 404,
      });
    }
    const isOwner = p.authorId === userId;
    const isAdmin = userRole === "ADMIN";
    if (!isOwner && !isAdmin) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "You can only delete prompts you authored",
        status: 403,
      });
    }
    if (p.isOfficial && !isAdmin) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Official Voldebug prompts can't be deleted by teachers",
        status: 403,
      });
    }
    await prisma.promptRecipe.update({
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
