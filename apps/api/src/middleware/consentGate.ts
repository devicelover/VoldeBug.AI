import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { isMinor } from "../modules/consent/consent.service.js";

/**
 * DPDP Act 2023 §9(1): a data fiduciary shall obtain verifiable parental
 * consent before processing a child's personal data. We interpret "process"
 * broadly — a minor without a GRANTED consent can read their own onboarding
 * state and request consent, but everything else (submitting work, using
 * AI tools, posting to the classroom, etc.) is blocked until a parent
 * approves.
 *
 * Apply this AFTER `authenticate` so `req.userId` is populated.
 *
 * Intentionally not applied to:
 *   - /v1/auth/*       (needed to log in, view status, re-request consent)
 *   - /v1/consent/*    (the consent flow itself)
 *   - /v1/users/onboarding/* (filling in DOB / student profile)
 *   - /v1/health
 */
export async function requireParentalConsent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.userId;
  if (!userId) return next(); // unauthenticated routes pass through

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dateOfBirth: true, role: true },
    });

    // Teachers/admins are adults by definition in our flow. If a real
    // school admin turns out to be underage, that's a much bigger
    // problem than this middleware can solve.
    if (!user || user.role !== "STUDENT") return next();
    if (!isMinor(user.dateOfBirth)) return next();

    const consent = await prisma.parentalConsent.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (consent?.status === "GRANTED") return next();

    return res.status(403).json({
      data: null,
      error: {
        code: "CONSENT_REQUIRED",
        message:
          "A parent or guardian must grant consent before you can use this feature.",
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error("[consentGate] lookup failed:", err);
    // Fail closed: if we can't verify consent for a minor, don't let
    // them through. This is the conservative default for a compliance
    // gate — better to show an error than accidentally bypass DPDP.
    return res.status(503).json({
      data: null,
      error: {
        code: "CONSENT_CHECK_FAILED",
        message: "Could not verify parental consent. Please try again shortly.",
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }
}
