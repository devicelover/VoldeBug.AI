import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";

// ─── PATCH /v1/users/me — self-service profile update ───────────────────
// Role, schoolId, onboardingStatus etc. are deliberately NOT here — those
// remain admin-only. CLAUDE.md §4.8 requires server-side authority over
// privileged fields.
const updateMeSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  image: z.string().url().max(2048).optional().or(z.literal("")),
  gradeLevel: z.number().int().min(1).max(12).optional(),
  studentId: z.string().min(1).max(40).optional().or(z.literal("")),
  dateOfBirth: z
    .string()
    .datetime({ message: "dateOfBirth must be an ISO-8601 timestamp" })
    .optional(),
});

export async function handleUpdateMe(req: Request, res: Response) {
  const userId = req.userId!;
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid update payload",
      status: 422,
    });
  }
  try {
    const data = parsed.data;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        image: data.image === "" ? null : data.image,
        gradeLevel: data.gradeLevel,
        studentId: data.studentId === "" ? null : data.studentId,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        onboardingStatus: true,
        gradeLevel: true,
        studentId: true,
        dateOfBirth: true,
      },
    });
    return apiSuccess(res, user);
  } catch (err) {
    return apiError(res, {
      code: "UPDATE_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}

export async function handleStudentOnboarding(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return apiError(res, { code: "UNAUTHORIZED", message: "Authentication required", status: 401 });
  }

  try {
    const { gradeLevel, studentId } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
        studentId,
        onboardingStatus: "COMPLETED",
      },
      select: { id: true, name: true, email: true, role: true, onboardingStatus: true },
    });

    return apiSuccess(res, user);
  } catch (err) {
    return apiError(res, { code: "ONBOARDING_FAILED", message: (err as Error).message, status: 400 });
  }
}

export async function handleTeacherOnboarding(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return apiError(res, { code: "UNAUTHORIZED", message: "Authentication required", status: 401 });
  }

  try {
    const { schoolName, className } = req.body;

    let schoolId: string;

    // Find or create school
    let school = await prisma.school.findFirst({ where: { name: schoolName } });
    if (!school) {
      school = await prisma.school.create({ data: { name: schoolName } });
    }
    schoolId = school.id;

    // Create class
    await prisma.class.create({
      data: {
        name: className,
        teacherId: userId,
        schoolId,
      },
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        schoolId,
        onboardingStatus: "COMPLETED",
      },
      select: { id: true, name: true, email: true, role: true, onboardingStatus: true },
    });

    return apiSuccess(res, user);
  } catch (err) {
    return apiError(res, { code: "ONBOARDING_FAILED", message: (err as Error).message, status: 400 });
  }
}
