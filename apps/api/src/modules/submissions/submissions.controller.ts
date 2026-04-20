import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import {
  createSubmissionSchema,
  gradeSubmissionSchema,
} from "./submissions.schema.js";
import { computeGradeXp } from "./submissions.service.js";
import { audit, AUDIT } from "../audit/audit.service.js";
import {
  buildObjectKey,
  createPresignedUploadUrl,
  isAllowedMimeType,
  isOwnedStorageUrl,
  MAX_UPLOAD_BYTES,
} from "../storage/storage.service.js";

export async function handleCreateSubmission(req: Request, res: Response) {
  const userId = req.userId!;

  // Zod validation gives us typed input + structured error messages.
  const parsed = createSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid submission",
      status: 422,
    });
  }
  const { assignmentId, fileUrls, studentNotes } = parsed.data;

  // Reject any URL that doesn't point at our own bucket — students used
  // to be able to "submit" arbitrary external URLs as their work. Skip
  // the check entirely if storage isn't configured (dev convenience),
  // but in production S3_BUCKET will be set so the check fires.
  const hasStorage = !!process.env.S3_BUCKET;
  if (hasStorage) {
    const stranger = fileUrls.find((u) => !isOwnedStorageUrl(u));
    if (stranger) {
      return apiError(res, {
        code: "INVALID_FILE_URL",
        message: "All files must be uploaded via the presigned URL flow",
        status: 422,
      });
    }
  }

  try {

    // Verify assignment exists and is published
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || (assignment as any).deletedAt) {
      return apiError(res, { code: "NOT_FOUND", message: "Assignment not found", status: 404 });
    }

    if (assignment.status !== "PUBLISHED") {
      return apiError(res, { code: "INVALID_STATE", message: "Cannot submit to unpublished assignment", status: 400 });
    }

    // Check if student already has a submission
    const existing = await prisma.submission.findFirst({
      where: { assignmentId, studentId: userId, deletedAt: null },
    });

    if (existing) {
      return apiError(res, { code: "ALREADY_SUBMITTED", message: "You already submitted this assignment", status: 409 });
    }

    const isEarly = new Date() < new Date(new Date(assignment.dueDate).getTime() - 2 * 24 * 60 * 60 * 1000);

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: userId,
        fileUrls,
        studentNotes,
        status: "SUBMITTED",
      },
      include: {
        assignment: {
          include: { suggestedTool: true },
        },
      },
    });

    // Award XP for submission
    let totalXP = assignment.xpReward || 50;
    if (isEarly) {
      totalXP += assignment.earlyBonus || 25;
    }

    await prisma.xPTransaction.create({
      data: {
        userId,
        amount: totalXP,
        source: isEarly ? "EARLY_SUBMISSION" : "ASSIGNMENT_SUBMIT",
        assignmentId,
      },
    });

    const { createNotification } = await import("../notifications/notifications.service.js");
    const sessionUser = await prisma.user.findUnique({ where: { id: userId } });
    createNotification({
      userId: assignment.creatorId,
      type: "TEACHER_MESSAGE",
      title: "New Submission",
      body: `${sessionUser?.name || "A student"} submitted work for ${assignment.title}.`,
    }).catch(console.error);

    return apiSuccess(res, { ...submission, xpAwarded: totalXP }, 201);
  } catch (err) {
    return apiError(res, { code: "SUBMIT_FAILED", message: (err as Error).message, status: 400 });
  }
}

export async function handleGetSubmission(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.userId!;
  const userRole = req.userRole!;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true, image: true } },
        assignment: {
          include: {
            suggestedTool: true,
            class: { select: { id: true, name: true, teacherId: true } },
            creator: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!submission) {
      return apiError(res, { code: "NOT_FOUND", message: "Submission not found", status: 404 });
    }

    // ── Ownership check ──────────────────────────────────────────────
    // STUDENT: only own submissions.
    // TEACHER: only submissions for assignments in classes they teach.
    // ADMIN:   any submission within their school (defense-in-depth: any).
    const isOwner = submission.studentId === userId;
    const isClassTeacher =
      userRole === "TEACHER" && submission.assignment.class.teacherId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isClassTeacher && !isAdmin) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "You do not have access to this submission",
        status: 403,
      });
    }

    return apiSuccess(res, submission);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch submission", status: 500 });
  }
}

export async function handleGetSubmissionHistory(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const { status } = req.query;

    const submissions = await prisma.submission.findMany({
      where: {
        studentId: userId,
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        assignment: {
          include: { suggestedTool: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return apiSuccess(res, submissions);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch submissions", status: 500 });
  }
}

export async function handleGetUploadPresignedUrl(req: Request, res: Response) {
  const userId = req.userId!;
  const { fileName, fileType, fileSize, assignmentId } = req.query;

  if (typeof fileName !== "string" || typeof fileType !== "string") {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: "fileName and fileType are required",
      status: 422,
    });
  }
  const sizeNum = Number(fileSize);
  if (!Number.isFinite(sizeNum) || sizeNum <= 0) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: "fileSize (bytes) is required",
      status: 422,
    });
  }
  if (sizeNum > MAX_UPLOAD_BYTES) {
    return apiError(res, {
      code: "FILE_TOO_LARGE",
      message: `File exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit`,
      status: 413,
    });
  }
  if (!isAllowedMimeType(fileType)) {
    return apiError(res, {
      code: "UNSUPPORTED_MIME_TYPE",
      message: `Files of type "${fileType}" are not allowed`,
      status: 415,
    });
  }

  try {
    const key = buildObjectKey({
      userId,
      assignmentId: typeof assignmentId === "string" ? assignmentId : undefined,
      fileName,
    });

    const { uploadUrl, publicUrl, expiresIn } = await createPresignedUploadUrl({
      key,
      contentType: fileType,
      contentLength: sizeNum,
    });

    void audit({
      action: AUDIT.UPLOAD_PRESIGNED,
      req,
      metadata: {
        fileName,
        fileType,
        fileSize: sizeNum,
        assignmentId: typeof assignmentId === "string" ? assignmentId : null,
        key,
      },
    });

    return apiSuccess(res, { uploadUrl, publicUrl, key, expiresIn });
  } catch (err) {
    return apiError(res, {
      code: "PRESIGN_FAILED",
      message: (err as Error).message,
      status: 500,
    });
  }
}

export async function handleListSubmissionsForAssignment(req: Request, res: Response) {
  const { assignmentId } = req.params;
  const userId = req.userId!;

  try {
    // Verify the requesting teacher owns the assignment's class
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { class: { select: { teacherId: true } } },
    });

    if (!assignment) {
      return apiError(res, { code: "NOT_FOUND", message: "Assignment not found", status: 404 });
    }

    if (assignment.class.teacherId !== userId) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "Only the class teacher can list submissions for this assignment",
        status: 403,
      });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId, deletedAt: null },
      include: {
        student: { select: { id: true, name: true, email: true, image: true } },
        assignment: { include: { suggestedTool: true, creator: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { submittedAt: "asc" },
    });

    return apiSuccess(res, submissions);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch submissions", status: 500 });
  }
}

export async function handleGradeSubmission(req: Request, res: Response) {
  const { id } = req.params;
  const graderId = req.userId!;

  // Validate the grading payload. Note that `xpAwarded` is NOT in the
  // schema — the server computes it from `score` so a tampered request
  // body cannot inflate XP. CLAUDE.md §4.7.
  const parsed = gradeSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid grade payload",
      status: 422,
    });
  }
  const { score, grade, feedback, teacherBonusXp } = parsed.data;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });

    if (!submission) {
      return apiError(res, { code: "NOT_FOUND", message: "Submission not found", status: 404 });
    }

    // Only the class teacher can grade
    if (submission.assignment.class.teacherId !== graderId) {
      return apiError(res, { code: "FORBIDDEN", message: "Only the class teacher can grade this submission", status: 403 });
    }

    // Server is the sole authority on XP — never trust the client.
    const xpAwarded = computeGradeXp(score, teacherBonusXp);

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        score,
        grade,
        feedback,
        xpAwarded,
        status: "GRADED",
        gradedAt: new Date(),
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    if (xpAwarded > 0) {
      await prisma.xPTransaction.create({
        data: {
          userId: submission.studentId,
          amount: xpAwarded,
          source: "ASSIGNMENT_GRADE",
          assignmentId: submission.assignmentId,
        },
      });
    }

    void audit({
      action: AUDIT.SUBMISSION_GRADED,
      req,
      targetUserId: submission.studentId,
      metadata: {
        submissionId: submission.id,
        assignmentId: submission.assignmentId,
        score,
        xpAwarded,
      },
    });

    const { createNotification } = await import("../notifications/notifications.service.js");

    createNotification({
      userId: submission.studentId,
      type: "GRADE_RECEIVED",
      title: "Grade Received",
      body: `Your submission for "${submission.assignment.title}" has been graded! Score: ${score}`,
    }).catch((err) => {
      // Don't crash the grading flow if the notification queue is down;
      // log and move on. Replace with the BullMQ enqueue once that lands.
      console.error("[grade] notification create failed:", err);
    });

    return apiSuccess(res, updated);
  } catch (err) {
    return apiError(res, { code: "GRADE_FAILED", message: (err as Error).message, status: 400 });
  }
}
