import type { Request, Response } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import { getSchoolOverview, getAuditLogs } from "./admin.service.js";
import { audit, AUDIT } from "../audit/audit.service.js";

export async function handleGetSchool(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const school = await prisma.school.findFirst({
      where: { adminId: userId },
      include: {
        _count: { select: { members: true, classes: true } },
      },
    });

    if (!school) {
      return apiError(res, { code: "NOT_FOUND", message: "School not found", status: 404 });
    }

    return apiSuccess(res, school);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch school", status: 500 });
  }
}

export async function handleListUsers(req: Request, res: Response) {
  const { role, page = 1, limit = 20, search } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          gradeLevel: true,
          lastActiveAt: true,
          createdAt: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return apiSuccess(res, { users, total }, 200, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to list users", status: 500 });
  }
}

export async function handleGetUser(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gradeLevel: true,
        studentId: true,
        image: true,
        lastActiveAt: true,
        onboardingStatus: true,
        createdAt: true,
        streak: true,
        _count: {
          select: {
            submissions: true,
            xpTransactions: true,
            badges: true,
          },
        },
      },
    });

    if (!user) {
      return apiError(res, { code: "NOT_FOUND", message: "User not found", status: 404 });
    }

    return apiSuccess(res, user);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch user", status: 500 });
  }
}

export async function handleUpdateUserRole(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body;

  try {
    // Validate against the generated UserRole enum so adding a new role
    // (e.g. PRINCIPAL) doesn't silently succeed against the old allowlist.
    if (!Object.values(UserRole).includes(role)) {
      return apiError(res, { code: "VALIDATION_ERROR", message: "Invalid role", status: 422 });
    }

    const before = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    void audit({
      action: AUDIT.USER_ROLE_CHANGED,
      req,
      targetUserId: id,
      metadata: { from: before?.role, to: user.role },
    });

    return apiSuccess(res, user);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to update role", status: 500 });
  }
}

export async function handleListClasses(req: Request, res: Response) {
  const { page = 1, limit = 20, schoolId } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (schoolId) where.schoolId = schoolId;

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          school: { select: { id: true, name: true } },
          _count: { select: { members: true, assignments: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.class.count({ where }),
    ]);

    return apiSuccess(res, { classes, total }, 200, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to list classes", status: 500 });
  }
}

export async function handleUpdateClass(req: Request, res: Response) {
  const { id } = req.params;
  const { name, teacherId } = req.body;

  try {
    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (teacherId) data.teacherId = teacherId;

    const updated = await prisma.class.update({
      where: { id },
      data,
    });

    return apiSuccess(res, updated);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to update class", status: 500 });
  }
}

export async function handleDeleteClass(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const before = await prisma.class.findUnique({
      where: { id },
      select: { name: true, schoolId: true, teacherId: true },
    });
    await prisma.class.delete({ where: { id } });
    void audit({
      action: AUDIT.CLASS_DELETED,
      req,
      metadata: { classId: id, ...before },
    });
    return apiSuccess(res, { success: true });
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to delete class", status: 500 });
  }
}

// ─── Security Audit Log Viewer (admin only) ───────────────────────────────

export async function handleListSecurityAuditLogs(req: Request, res: Response) {
  const { page = 1, limit = 50, action, actorId, targetUserId } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (typeof action === "string") where.action = action;
    if (typeof actorId === "string") where.actorId = actorId;
    if (typeof targetUserId === "string") where.targetUserId = targetUserId;

    const [logs, total] = await Promise.all([
      prisma.securityAuditLog.findMany({
        where,
        skip,
        take: Math.min(Number(limit), 200),
        orderBy: { createdAt: "desc" },
      }),
      prisma.securityAuditLog.count({ where }),
    ]);

    return apiSuccess(res, { logs, total }, 200, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch security audit logs",
      status: 500,
    });
  }
}

// ─── Principal Dashboard: School Overview ─────────────────────────────────

export async function handleGetSchoolOverview(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const overview = await getSchoolOverview(userId);

    if (!overview) {
      return apiError(res, { code: "NOT_FOUND", message: "No school found for this admin", status: 404 });
    }

    return apiSuccess(res, overview);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch school overview", status: 500 });
  }
}

// ─── Admin: update school settings ───────────────────────────────────────

const updateSchoolSchema = z.object({
  name: z.string().min(2).max(120).optional(),
});

export async function handleUpdateSchool(req: Request, res: Response) {
  const adminId = req.userId!;
  const parsed = updateSchoolSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid update payload",
      status: 422,
    });
  }
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { schoolId: true },
    });
    if (!admin?.schoolId) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Your account is not linked to a school",
        status: 403,
      });
    }
    const updated = await prisma.school.update({
      where: { id: admin.schoolId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        _count: { select: { members: true, classes: true } },
      },
    });
    return apiSuccess(res, updated);
  } catch (err) {
    return apiError(res, {
      code: "UPDATE_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}

// ─── Admin: bulk roster CSV import ───────────────────────────────────────
// Accepts an array of {name, email, role, gradeLevel?, classId?}.
// Creates User rows for new emails (random temp password — admin shares),
// updates existing users (if same email is in the same school).

const rosterRowSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(["STUDENT", "TEACHER"]),
  gradeLevel: z.number().int().min(1).max(12).optional(),
  classId: z.string().min(1).optional(),
});
const rosterImportSchema = z.object({
  rows: z.array(rosterRowSchema).min(1).max(500),
});

export async function handleRosterImport(req: Request, res: Response) {
  const adminId = req.userId!;
  const parsed = rosterImportSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid roster",
      status: 422,
    });
  }
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { schoolId: true },
    });
    if (!admin?.schoolId) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Your account is not linked to a school",
        status: 403,
      });
    }

    let created = 0;
    let updated = 0;
    let addedToClass = 0;
    const errors: { email: string; reason: string }[] = [];

    for (const row of parsed.data.rows) {
      try {
        // Random initial password (admin must reset / share via OOB).
        // bcryptjs hash performed only if creating.
        const existing = await prisma.user.findUnique({
          where: { email: row.email },
        });
        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              gradeLevel: row.gradeLevel,
              schoolId: admin.schoolId,
              role: row.role,
            },
          });
          updated += 1;
          if (row.classId && row.role === "STUDENT") {
            await prisma.classMember.upsert({
              where: {
                classId_userId: { classId: row.classId, userId: existing.id },
              },
              update: {},
              create: { classId: row.classId, userId: existing.id },
            });
            addedToClass += 1;
          }
        } else {
          const { hash } = await import("bcryptjs");
          const tempPassword = Math.random().toString(36).slice(-12);
          const newUser = await prisma.user.create({
            data: {
              name: row.name,
              email: row.email,
              passwordHash: await hash(tempPassword, 12),
              role: row.role,
              gradeLevel: row.gradeLevel,
              schoolId: admin.schoolId,
            },
          });
          created += 1;
          if (row.classId && row.role === "STUDENT") {
            await prisma.classMember.create({
              data: { classId: row.classId, userId: newUser.id },
            });
            addedToClass += 1;
          }
        }
      } catch (err) {
        errors.push({ email: row.email, reason: (err as Error).message });
      }
    }

    return apiSuccess(res, { created, updated, addedToClass, errors });
  } catch (err) {
    return apiError(res, {
      code: "IMPORT_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}

// ─── Admin: tool catalog CRUD ────────────────────────────────────────────

const toolSchema = z.object({
  name: z.string().min(2).max(80),
  category: z.enum([
    "CHAT_AI",
    "CODE_AI",
    "IMAGE_AI",
    "WRITING_AI",
    "RESEARCH_AI",
  ]),
  description: z.string().min(5).max(2000),
  logoUrl: z.string().url().max(2048),
  websiteUrl: z.string().url().max(2048).optional(),
  brandColor: z.string().max(20).optional(),
  useCases: z.array(z.string().min(1).max(200)).max(20).default([]),
  subjects: z.array(z.string().min(1).max(40)).max(20).default([]),
  howTo: z.array(z.string().min(1).max(500)).max(20).default([]),
  examplePrompts: z.array(z.string().min(1).max(500)).max(20).default([]),
  proTips: z.array(z.string().min(1).max(500)).max(20).default([]),
});

export async function handleAdminListTools(req: Request, res: Response) {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return apiSuccess(res, { tools });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to list tools",
      status: 500,
    });
  }
}

export async function handleCreateTool(req: Request, res: Response) {
  const parsed = toolSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid tool",
      status: 422,
    });
  }
  try {
    const tool = await prisma.tool.create({
      data: {
        ...parsed.data,
        brandColor: parsed.data.brandColor ?? "#6366f1",
      },
    });
    return apiSuccess(res, tool, 201);
  } catch (err) {
    return apiError(res, {
      code: "CREATE_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}

export async function handleDeleteTool(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.tool.delete({ where: { id } });
    return apiSuccess(res, { id });
  } catch (err) {
    return apiError(res, {
      code: "DELETE_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}

// ─── Principal: outcome reports ──────────────────────────────────────────
// Aggregations every principal asks at PTA: average score by class,
// completion rate, most-used AI tool, integrity health. Designed to be
// printable / parent-shareable later (no PDF gen yet — just data).

export async function handlePrincipalReports(req: Request, res: Response) {
  const adminId = req.userId!;
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { schoolId: true },
    });
    if (!admin?.schoolId) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Your account is not linked to a school",
        status: 403,
      });
    }

    const classes = await prisma.class.findMany({
      where: { schoolId: admin.schoolId },
      select: {
        id: true,
        name: true,
        teacher: { select: { id: true, name: true } },
        _count: { select: { members: true, assignments: true } },
      },
    });
    const classIds = classes.map((c) => c.id);

    // Per-class average score + completion rate
    const submissions = await prisma.submission.findMany({
      where: {
        deletedAt: null,
        assignment: { classId: { in: classIds } },
      },
      select: {
        score: true,
        status: true,
        assignment: { select: { classId: true } },
      },
    });

    const perClass = classes.map((c) => {
      const subs = submissions.filter((s) => s.assignment.classId === c.id);
      const graded = subs.filter((s) => s.status === "GRADED" && s.score != null);
      const avg =
        graded.length > 0
          ? Math.round(
              graded.reduce((sum, s) => sum + (s.score ?? 0), 0) / graded.length,
            )
          : null;
      const completionRate =
        c._count.assignments * c._count.members > 0
          ? Math.round(
              (subs.length / (c._count.assignments * c._count.members)) * 100,
            )
          : null;
      return {
        classId: c.id,
        className: c.name,
        teacherName: c.teacher?.name ?? "—",
        members: c._count.members,
        assignments: c._count.assignments,
        submissions: subs.length,
        averageScore: avg,
        completionRate,
      };
    });

    // Tool usage across the school (audit_logs.toolUsed counts)
    const studentIds = (
      await prisma.user.findMany({
        where: { schoolId: admin.schoolId, role: "STUDENT" },
        select: { id: true },
      })
    ).map((s) => s.id);

    const toolUsage = await prisma.auditLog.groupBy({
      by: ["toolUsed"],
      where: { studentId: { in: studentIds } },
      _count: { _all: true },
      orderBy: { _count: { toolUsed: "desc" } },
      take: 10,
    });

    const integrityHealth = await prisma.auditLog.aggregate({
      where: { studentId: { in: studentIds } },
      _count: { _all: true },
    });
    const flaggedCount = await prisma.auditLog.count({
      where: { studentId: { in: studentIds }, isFlagged: true },
    });

    return apiSuccess(res, {
      perClass,
      toolUsage: toolUsage.map((t) => ({
        tool: t.toolUsed,
        count: t._count._all,
      })),
      integrity: {
        total: integrityHealth._count._all,
        flagged: flaggedCount,
        flaggedRatio:
          integrityHealth._count._all > 0
            ? Math.round((flaggedCount / integrityHealth._count._all) * 100)
            : 0,
      },
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to build report",
      status: 500,
    });
  }
}

// ─── Principal: teacher performance ──────────────────────────────────────

export async function handlePrincipalTeachers(req: Request, res: Response) {
  const adminId = req.userId!;
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { schoolId: true },
    });
    if (!admin?.schoolId) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Your account is not linked to a school",
        status: 403,
      });
    }

    const teachers = await prisma.user.findMany({
      where: { schoolId: admin.schoolId, role: "TEACHER" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        lastActiveAt: true,
        createdAt: true,
        _count: { select: { taughtClasses: true, assignments: true } },
      },
      orderBy: { name: "asc" },
    });

    // Average score given by each teacher across their assignments.
    const teacherIds = teachers.map((t) => t.id);
    const grades = await prisma.submission.groupBy({
      by: ["assignmentId"],
      where: {
        status: "GRADED",
        assignment: { creatorId: { in: teacherIds } },
      },
      _avg: { score: true },
      _count: { _all: true },
    });
    const assignmentToCreator = new Map<string, string>();
    const assignments = await prisma.assignment.findMany({
      where: { creatorId: { in: teacherIds } },
      select: { id: true, creatorId: true },
    });
    assignments.forEach((a) => assignmentToCreator.set(a.id, a.creatorId));

    const perTeacher = new Map<
      string,
      { totalGraded: number; sumScore: number }
    >();
    for (const g of grades) {
      const creator = assignmentToCreator.get(g.assignmentId);
      if (!creator) continue;
      const acc = perTeacher.get(creator) ?? { totalGraded: 0, sumScore: 0 };
      acc.totalGraded += g._count._all;
      acc.sumScore += (g._avg.score ?? 0) * g._count._all;
      perTeacher.set(creator, acc);
    }

    const enriched = teachers.map((t) => {
      const stats = perTeacher.get(t.id);
      return {
        ...t,
        classesCount: t._count.taughtClasses,
        assignmentsCount: t._count.assignments,
        gradedCount: stats?.totalGraded ?? 0,
        averageScoreGiven:
          stats && stats.totalGraded > 0
            ? Math.round(stats.sumScore / stats.totalGraded)
            : null,
      };
    });

    return apiSuccess(res, { teachers: enriched });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to load teachers",
      status: 500,
    });
  }
}

// ─── Principal: school-wide AI usage heatmap (last 60 days) ──────────────

export async function handlePrincipalHeatmap(req: Request, res: Response) {
  const adminId = req.userId!;
  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { schoolId: true },
    });
    if (!admin?.schoolId) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Your account is not linked to a school",
        status: 403,
      });
    }

    const studentIds = (
      await prisma.user.findMany({
        where: { schoolId: admin.schoolId, role: "STUDENT" },
        select: { id: true },
      })
    ).map((s) => s.id);

    const since = new Date();
    since.setDate(since.getDate() - 60);
    since.setHours(0, 0, 0, 0);

    const logs = await prisma.auditLog.findMany({
      where: {
        studentId: { in: studentIds },
        timestamp: { gte: since },
      },
      select: { timestamp: true, isFlagged: true },
    });

    // Bucket per day. Map: yyyy-mm-dd → {total, flagged}
    const buckets: Record<string, { total: number; flagged: number }> = {};
    for (const log of logs) {
      const d = log.timestamp.toISOString().slice(0, 10);
      const b = buckets[d] ?? { total: 0, flagged: 0 };
      b.total += 1;
      if (log.isFlagged) b.flagged += 1;
      buckets[d] = b;
    }

    // Densify: emit every day in the window even if 0, for clean UI rendering.
    const days: { date: string; total: number; flagged: number }[] = [];
    for (
      let d = new Date(since);
      d <= new Date();
      d.setDate(d.getDate() + 1)
    ) {
      const key = d.toISOString().slice(0, 10);
      const b = buckets[key] ?? { total: 0, flagged: 0 };
      days.push({ date: key, total: b.total, flagged: b.flagged });
    }

    return apiSuccess(res, { days });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to build heatmap",
      status: 500,
    });
  }
}

// ─── Principal Dashboard: Audit Logs ──────────────────────────────────────

export async function handleGetAuditLogs(req: Request, res: Response) {
  const { limit = 20, offset = 0, flagged, studentId, tool } = req.query;

  try {
    const filters: { isFlagged?: boolean; studentId?: string; toolUsed?: string } = {};
    if (flagged === "true") filters.isFlagged = true;
    if (flagged === "false") filters.isFlagged = false;
    if (studentId && typeof studentId === "string") filters.studentId = studentId;
    if (tool && typeof tool === "string") filters.toolUsed = tool;

    const result = await getAuditLogs(Number(limit), Number(offset), filters);

    return apiSuccess(res, result, 200, {
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      limit: Number(limit),
      total: result.total,
    });
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch audit logs", status: 500 });
  }
}
