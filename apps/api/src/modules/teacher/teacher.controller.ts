import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";

export async function handleTeacherDashboard(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    // Get teacher's classes
    const classes = await prisma.class.findMany({
      where: { teacherId: userId },
      include: {
        _count: { select: { assignments: true, members: true } },
      },
    });

    const classIds = classes.map((c) => c.id);

    // Get assignment IDs
    const assignments = await prisma.assignment.findMany({
      where: { classId: { in: classIds }, status: "PUBLISHED", deletedAt: null },
      select: { id: true },
    });
    const assignmentIds = assignments.map((a) => a.id);

    // Active assignments count
    const activeAssignments = assignments.length;

    // Pending submissions (ungraded)
    const pendingSubmissionsList = await prisma.submission.findMany({
      where: { assignmentId: { in: assignmentIds }, status: "SUBMITTED", deletedAt: null },
      include: {
        student: { select: { id: true, name: true, image: true } },
        assignment: { select: { title: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    });

    const recentSubmissions = pendingSubmissionsList.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.student.name || s.student.id,
      studentImage: s.student.image,
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment.title,
      submittedAt: s.submittedAt.toISOString(),
      status: s.status,
      score: s.score,
      grade: s.grade,
      xpAwarded: s.xpAwarded,
    }));

    // Total students
    const totalStudents = classes.reduce((sum, c) => sum + c._count.members, 0);

    // Graded submissions for stats
    const gradedSubmissions = await prisma.submission.findMany({
      where: { assignmentId: { in: assignmentIds }, status: { in: ["GRADED", "RETURNED"] }, deletedAt: null },
      select: { score: true },
    });

    const averageGrade =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
        : null;

    const submissionCount = gradedSubmissions.length + pendingSubmissionsList.length;
    const completionRate =
      assignmentIds.length > 0
        ? Math.round((gradedSubmissions.length / assignmentIds.length) * 100)
        : 0;

    return apiSuccess(res, {
      activeAssignments,
      pendingSubmissions: pendingSubmissionsList.length,
      totalStudents,
      averageGrade,
      completionRate,
      classInfo: classes,
      recentSubmissions,
    });
  } catch (err) {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: `Failed to fetch teacher dashboard: ${(err as Error).message}`,
      status: 500,
    });
  }
}

export async function handleTeacherClasses(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const classes = await prisma.class.findMany({
      where: { teacherId: userId },
      include: {
        _count: {
          select: { assignments: true, members: true },
        },
      },
    });

    return apiSuccess(res, classes);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch classes",
      status: 500,
    });
  }
}

// ─── Roster across all of the teacher's classes ──────────────────────────
// Returns every student the teacher is responsible for, deduplicated, with
// per-student submission + flag counts. Used by /dashboard/teacher/students.

export async function handleTeacherAllStudents(req: Request, res: Response) {
  const teacherId = req.userId!;
  try {
    const classes = await prisma.class.findMany({
      where: { teacherId },
      select: { id: true, name: true },
    });
    const classIds = classes.map((c) => c.id);
    if (classIds.length === 0) {
      return apiSuccess(res, { students: [] });
    }

    const memberships = await prisma.classMember.findMany({
      where: { classId: { in: classIds } },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, gradeLevel: true },
        },
      },
    });

    type Acc = Record<string, {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      gradeLevel: number | null;
      classes: string[];
    }>;
    const byStudent: Acc = {};
    for (const m of memberships) {
      const u = m.user;
      const cls = classes.find((c) => c.id === m.classId)?.name;
      if (!byStudent[u.id]) {
        byStudent[u.id] = {
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          gradeLevel: u.gradeLevel,
          classes: [],
        };
      }
      if (cls && !byStudent[u.id].classes.includes(cls)) {
        byStudent[u.id].classes.push(cls);
      }
    }
    const studentIds = Object.keys(byStudent);

    const [submissionCounts, flaggedCounts] = await Promise.all([
      prisma.submission.groupBy({
        by: ["studentId"],
        where: { studentId: { in: studentIds }, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.auditLog.groupBy({
        by: ["studentId"],
        where: { studentId: { in: studentIds }, isFlagged: true },
        _count: { _all: true },
      }),
    ]);
    const subMap = new Map(submissionCounts.map((s) => [s.studentId, s._count._all]));
    const flagMap = new Map(flaggedCounts.map((f) => [f.studentId, f._count._all]));

    const students = Object.values(byStudent)
      .map((s) => ({
        ...s,
        submissions: subMap.get(s.id) ?? 0,
        flagged: flagMap.get(s.id) ?? 0,
      }))
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

    return apiSuccess(res, { students });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to load students",
      status: 500,
    });
  }
}

// ─── Per-student profile (teacher-scoped) ────────────────────────────────

export async function handleTeacherStudent(req: Request, res: Response) {
  const teacherId = req.userId!;
  const { studentId } = req.params;
  try {
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId },
      select: { id: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    // Authz: student must be in one of those classes.
    const membership = await prisma.classMember.findFirst({
      where: { userId: studentId, classId: { in: classIds } },
    });
    if (!membership) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Student is not in any of your classes",
        status: 403,
      });
    }

    const [student, submissions, flagged, totalLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          gradeLevel: true,
          studentId: true,
          createdAt: true,
        },
      }),
      prisma.submission.findMany({
        where: {
          studentId,
          deletedAt: null,
          assignment: { classId: { in: classIds } },
        },
        include: {
          assignment: { select: { id: true, title: true, dueDate: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 30,
      }),
      prisma.auditLog.findMany({
        where: { studentId, isFlagged: true },
        orderBy: { timestamp: "desc" },
        take: 20,
        select: {
          id: true,
          toolUsed: true,
          promptText: true,
          flagReasons: true,
          timestamp: true,
          assignment: { select: { id: true, title: true } },
        },
      }),
      prisma.auditLog.count({ where: { studentId } }),
    ]);

    if (!student) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Student not found",
        status: 404,
      });
    }

    return apiSuccess(res, {
      student,
      submissions,
      flagged,
      stats: {
        submissions: submissions.length,
        flaggedAi: flagged.length,
        totalAiInteractions: totalLogs,
      },
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to load student profile",
      status: 500,
    });
  }
}

export async function handleTeacherClassDetail(req: Request, res: Response) {
  const userId = req.userId!;
  const { classId } = req.params;

  try {
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                gradeLevel: true,
                studentId: true,
              },
            },
          },
        },
        assignments: {
          where: { deletedAt: null },
          orderBy: { dueDate: "asc" },
          include: {
            suggestedTool: { select: { id: true, name: true } },
            _count: { select: { submissions: true } },
          },
        },
      },
    });

    if (!cls || cls.teacherId !== userId) {
      return apiError(res, { code: "NOT_FOUND", message: "Class not found", status: 404 });
    }

    // Compute per-student completion stats
    const assignmentIds = cls.assignments.map((a) => a.id);
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: { in: assignmentIds }, deletedAt: null },
      select: { studentId: true, assignmentId: true, status: true, score: true, xpAwarded: true },
    });

    const studentStats = cls.members.map((m) => {
      const studentSubs = submissions.filter((s) => s.studentId === m.userId);
      const completed = studentSubs.filter((s) => s.status === "GRADED" || s.status === "RETURNED").length;
      const avgScore = studentSubs.length > 0
        ? Math.round(studentSubs.reduce((acc, s) => acc + (s.score ?? 0), 0) / studentSubs.length)
        : null;
      return {
        ...m.user,
        submissionsCount: studentSubs.length,
        completedCount: completed,
        avgScore,
        totalXPEarned: studentSubs.reduce((acc, s) => acc + (s.xpAwarded ?? 0), 0),
      };
    });

    return apiSuccess(res, {
      ...cls,
      memberStats: studentStats,
    });
  } catch (err) {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: `Failed to fetch class detail: ${(err as Error).message}`,
      status: 500,
    });
  }
}