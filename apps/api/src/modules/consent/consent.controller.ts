import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import { audit, AUDIT } from "../audit/audit.service.js";
import {
  ensurePendingConsent,
  findConsentByToken,
  recordConsentDecision,
} from "./consent.service.js";

// ─── Student: check own consent status ────────────────────────────────────

export async function handleGetMyConsent(req: Request, res: Response) {
  const userId = req.userId!;
  try {
    const consent = await prisma.parentalConsent.findUnique({
      where: { userId },
    });
    if (!consent) return apiSuccess(res, { status: "NOT_REQUIRED" });
    return apiSuccess(res, {
      status: consent.status,
      tokenExpiresAt: consent.tokenExpiresAt,
      respondedAt: consent.respondedAt,
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to load consent status",
      status: 500,
    });
  }
}

// ─── Student: request (or re-request) parent consent ─────────────────────
// Returns the token-bearing URL the school would email the parent.
// Real email delivery is a BullMQ job — see followups.

const requestSchema = z.object({
  parentEmail: z.string().email(),
  parentName: z.string().min(2).max(120),
  parentRelationship: z.string().min(2).max(60),
});

export async function handleRequestConsent(req: Request, res: Response) {
  const userId = req.userId!;
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid consent request",
      status: 422,
    });
  }

  try {
    const record = await ensurePendingConsent(userId);
    await prisma.parentalConsent.update({
      where: { id: record.id },
      data: {
        parentEmail: parsed.data.parentEmail,
        parentName: parsed.data.parentName,
        parentRelationship: parsed.data.parentRelationship,
      },
    });

    void audit({
      action: AUDIT.CONSENT_REQUESTED,
      req,
      targetUserId: userId,
      metadata: { parentEmail: parsed.data.parentEmail },
    });

    const base = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";
    return apiSuccess(res, {
      status: "PENDING",
      consentUrl: `${base}/consent/${record.token}`,
      tokenExpiresAt: record.tokenExpiresAt,
    });
  } catch (err) {
    return apiError(res, {
      code: "CONSENT_REQUEST_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}

// ─── Public: parent views the consent form ───────────────────────────────

export async function handleViewConsent(req: Request, res: Response) {
  const { token } = req.params;
  try {
    const record = await findConsentByToken(token);
    if (!record) {
      return apiError(res, {
        code: "INVALID_TOKEN",
        message: "This consent link is invalid",
        status: 404,
      });
    }
    const student = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { name: true, email: true, dateOfBirth: true },
    });
    return apiSuccess(res, {
      status: record.status,
      expired: record.tokenExpiresAt < new Date(),
      tokenExpiresAt: record.tokenExpiresAt,
      respondedAt: record.respondedAt,
      student: student ? { name: student.name, email: student.email } : null,
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to load consent form",
      status: 500,
    });
  }
}

// ─── Public: parent submits decision ─────────────────────────────────────

const decisionSchema = z.object({
  grant: z.boolean(),
  parentName: z.string().min(2).max(120),
  parentEmail: z.string().email(),
  parentRelationship: z.string().min(2).max(60),
});

export async function handleSubmitConsent(req: Request, res: Response) {
  const { token } = req.params;
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid consent submission",
      status: 422,
    });
  }

  try {
    const ip =
      req.ip ??
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      null;

    const updated = await recordConsentDecision({
      token,
      grant: parsed.data.grant,
      parentName: parsed.data.parentName,
      parentEmail: parsed.data.parentEmail,
      parentRelationship: parsed.data.parentRelationship,
      respondedFromIp: ip,
    });

    void audit({
      action: parsed.data.grant ? AUDIT.CONSENT_GRANTED : AUDIT.CONSENT_DENIED,
      req,
      targetUserId: updated.userId,
      actorEmail: parsed.data.parentEmail,
      actorRole: "PARENT",
      metadata: {
        parentName: parsed.data.parentName,
        parentRelationship: parsed.data.parentRelationship,
      },
    });

    return apiSuccess(res, {
      status: updated.status,
      respondedAt: updated.respondedAt,
    });
  } catch (err) {
    return apiError(res, {
      code: "CONSENT_SUBMIT_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}
