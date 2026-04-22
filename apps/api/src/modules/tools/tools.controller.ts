import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";

export async function handleListTools(req: Request, res: Response) {
  try {
    const { category, search } = req.query;

    // Build the WHERE properly. Previously the function fetched all tools
    // and post-filtered in JS — fine for 10 rows, broken at 100+, and the
    // bogus `where.search = {mode, contains}` would have been a Prisma
    // error if it ever ran (it never did because filtering was JS-side).
    const where: Record<string, unknown> = {};
    if (category && typeof category === "string") {
      where.category = category;
    }
    if (search && typeof search === "string" && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const tools = await prisma.tool.findMany({
      where,
      orderBy: { usageCount: "desc" },
    });

    return apiSuccess(res, tools);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch tools",
      status: 500,
    });
  }
}

export async function handleGetTool(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tool = await prisma.tool.findUnique({
      where: { id },
    });
    if (!tool) {
      return apiError(res, { code: "NOT_FOUND", message: "Tool not found", status: 404 });
    }
    return apiSuccess(res, tool);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch tool", status: 500 });
  }
}
