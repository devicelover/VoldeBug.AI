import { randomBytes } from "node:crypto";
import { prisma } from "../../utils/prisma.js";

// India's DPDP Act 2023 defines a "child" as anyone under 18. A data
// fiduciary (that's us) must obtain verifiable parental consent before
// processing a child's personal data for anything beyond what is
// strictly necessary to onboard them and request that consent.
//
// CLAUDE.md §4.8 mentions COPPA (<13) which is a US standard; our
// threshold is the stricter Indian one. Schools can ask us to relax
// this per-tenant later if a jurisdiction allows it.
export const MINOR_AGE_THRESHOLD = 18;
export const CONSENT_TOKEN_TTL_DAYS = 30;

export function computeAgeYears(dob: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function isMinor(dob: Date | null | undefined): boolean {
  if (!dob) return false;
  return computeAgeYears(dob) < MINOR_AGE_THRESHOLD;
}

/**
 * Ensure a PENDING consent record exists for a minor user. Idempotent —
 * calling it repeatedly on the same user refreshes the token if expired
 * but does not reset a GRANTED status.
 */
export async function ensurePendingConsent(userId: string) {
  const existing = await prisma.parentalConsent.findUnique({
    where: { userId },
  });

  if (existing && existing.status === "GRANTED") return existing;

  const token = randomBytes(32).toString("hex");
  const tokenExpiresAt = new Date(
    Date.now() + CONSENT_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  if (!existing) {
    return prisma.parentalConsent.create({
      data: { userId, status: "PENDING", token, tokenExpiresAt },
    });
  }

  // If a previous token expired or the parent denied, issue a fresh token
  // so the school can re-request.
  if (existing.tokenExpiresAt < new Date() || existing.status === "EXPIRED") {
    return prisma.parentalConsent.update({
      where: { userId },
      data: { status: "PENDING", token, tokenExpiresAt, respondedAt: null },
    });
  }

  return existing;
}

/** Look up a consent record by its URL token. */
export function findConsentByToken(token: string) {
  return prisma.parentalConsent.findUnique({ where: { token } });
}

/** Record the parent's decision. Only callable on a PENDING record. */
export async function recordConsentDecision(opts: {
  token: string;
  grant: boolean;
  parentName: string;
  parentEmail: string;
  parentRelationship: string;
  respondedFromIp: string | null;
}) {
  const record = await prisma.parentalConsent.findUnique({
    where: { token: opts.token },
  });
  if (!record) throw new Error("Invalid consent token");
  if (record.tokenExpiresAt < new Date()) {
    await prisma.parentalConsent.update({
      where: { id: record.id },
      data: { status: "EXPIRED" },
    });
    throw new Error("This consent link has expired");
  }
  if (record.status !== "PENDING") {
    throw new Error("This consent link has already been used");
  }

  return prisma.parentalConsent.update({
    where: { id: record.id },
    data: {
      status: opts.grant ? "GRANTED" : "DENIED",
      parentName: opts.parentName,
      parentEmail: opts.parentEmail,
      parentRelationship: opts.parentRelationship,
      respondedAt: new Date(),
      respondedFromIp: opts.respondedFromIp,
    },
  });
}
