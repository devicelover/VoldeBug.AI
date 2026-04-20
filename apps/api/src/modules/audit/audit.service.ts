import type { Request } from "express";
import { prisma } from "../../utils/prisma.js";

// Centralized list of audit-worthy actions. Add new ones here so we can
// refer to them by symbolic name and enforce typo-resistance.
//
// Naming convention: `resource.verb` (lowercase, dot-separated).
export const AUDIT = {
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILED: "auth.login.failed",
  AUTH_REGISTER: "auth.register",
  AUTH_ROLE_SET: "auth.role.set",
  USER_ROLE_CHANGED: "user.role.changed",
  CLASS_DELETED: "class.deleted",
  SUBMISSION_GRADED: "submission.graded",
  UPLOAD_PRESIGNED: "upload.presigned",
  // DPDP Act 2023 parental-consent lifecycle
  CONSENT_REQUESTED: "consent.requested",
  CONSENT_GRANTED: "consent.granted",
  CONSENT_DENIED: "consent.denied",
} as const;

export type AuditAction = (typeof AUDIT)[keyof typeof AUDIT];

export interface AuditPayload {
  action: AuditAction;
  // Actor: pulled from req when available; can be omitted for failed-auth events.
  req?: Request;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  // Subject of the action — e.g. the user whose role was changed.
  targetUserId?: string | null;
  // Free-form action context. Keep it small and PII-light.
  metadata?: Record<string, unknown>;
}

/**
 * Append to the security audit log. Non-blocking by design — if the audit
 * write fails we log and move on rather than break the user flow. Wrap
 * call sites with `void audit({...})` or await depending on whether you
 * want write durability before responding.
 */
export async function audit(payload: AuditPayload): Promise<void> {
  try {
    const ip =
      payload.req?.ip ??
      (payload.req?.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      null;
    const userAgent = payload.req?.headers["user-agent"] ?? null;

    await prisma.securityAuditLog.create({
      data: {
        action: payload.action,
        actorId: payload.actorId ?? payload.req?.userId ?? null,
        actorEmail: payload.actorEmail ?? null,
        actorRole: payload.actorRole ?? payload.req?.userRole ?? null,
        targetUserId: payload.targetUserId ?? null,
        ip,
        userAgent: userAgent ?? null,
        metadata: payload.metadata ? (payload.metadata as object) : undefined,
      },
    });
  } catch (err) {
    // Audit must never break the request. Log and continue.
    console.error("[audit] write failed:", payload.action, err);
  }
}
