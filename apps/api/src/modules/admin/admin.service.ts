import { prisma } from "../../utils/prisma.js";

// ─── School-wide Overview Aggregation ────────────────────────────────────

export async function getSchoolOverview(adminUserId: string) {
  // Find the school this admin manages
  const school = await prisma.school.findFirst({
    where: { adminId: adminUserId },
    select: { id: true, name: true },
  });

  if (!school) return null;

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalAssignments,
    totalSubmissions,
    totalFlaggedLogs,
    totalAuditLogs,
    recentSubmissions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.class.count({ where: { schoolId: school.id } }),
    prisma.assignment.count({
      where: { class: { schoolId: school.id }, deletedAt: null },
    }),
    prisma.submission.count({
      where: {
        assignment: { class: { schoolId: school.id } },
        deletedAt: null,
      },
    }),
    prisma.auditLog.count({ where: { isFlagged: true } }),
    prisma.auditLog.count(),
    prisma.submission.count({
      where: {
        assignment: { class: { schoolId: school.id } },
        deletedAt: null,
        submittedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
        },
      },
    }),
  ]);

  // Average score across all graded submissions
  const graded = await prisma.submission.aggregate({
    where: {
      assignment: { class: { schoolId: school.id } },
      status: "GRADED",
      score: { not: null },
      deletedAt: null,
    },
    _avg: { score: true },
    _count: { score: true },
  });

  return {
    school: { id: school.id, name: school.name },
    totalStudents,
    totalTeachers,
    totalClasses,
    totalAssignments,
    totalSubmissions,
    recentSubmissions,
    averageScore: graded._avg.score ? Math.round(graded._avg.score * 10) / 10 : null,
    gradedCount: graded._count.score,
    auditLogs: {
      total: totalAuditLogs,
      flagged: totalFlaggedLogs,
    },
  };
}

// ─── Paginated Audit Logs ────────────────────────────────────────────────

export async function getAuditLogs(
  limit: number = 20,
  offset: number = 0,
  filters?: { isFlagged?: boolean; studentId?: string; toolUsed?: string },
) {
  const where: Record<string, unknown> = {};

  if (filters?.isFlagged !== undefined) {
    where.isFlagged = filters.isFlagged;
  }
  if (filters?.studentId) {
    where.studentId = filters.studentId;
  }
  if (filters?.toolUsed) {
    where.toolUsed = filters.toolUsed;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, gradeLevel: true },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
