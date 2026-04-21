import express from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { requireParentalConsent } from "../../middleware/consentGate.js";
import { submissionLimiter } from "../../middleware/rateLimiter.js";
import {
  handleLogAiInteraction,
  handleGetMyAiHistory,
  handleSubmissionIntegrity,
  handleClassIntegrityFeed,
  handleSchoolIntegrityFeed,
  handleStudentIntegrityHistory,
} from "./integrity.controller.js";

const integrityRouter = express.Router();

// ── Student endpoints ────────────────────────────────────────────────────
// Logging an AI interaction is gated by parental consent for the same
// reason submission is — it persists data about the minor's behaviour.
integrityRouter.post(
  "/log",
  authenticate,
  requireParentalConsent,
  submissionLimiter, // reuse — same write-quota class
  handleLogAiInteraction,
);

integrityRouter.get("/me", authenticate, handleGetMyAiHistory);

// ── Teacher endpoints ────────────────────────────────────────────────────
integrityRouter.get(
  "/submission/:submissionId",
  authenticate,
  requireRole("TEACHER"),
  handleSubmissionIntegrity,
);

integrityRouter.get(
  "/class/:classId",
  authenticate,
  requireRole("TEACHER"),
  handleClassIntegrityFeed,
);

// ── Admin / Principal endpoints ─────────────────────────────────────────
// Same role ("ADMIN") covers both tiers today. When we split into a
// dedicated PRINCIPAL role, widen the guard here.
integrityRouter.get(
  "/school",
  authenticate,
  requireRole("ADMIN"),
  handleSchoolIntegrityFeed,
);

integrityRouter.get(
  "/student/:studentId",
  authenticate,
  requireRole("ADMIN"),
  handleStudentIntegrityHistory,
);

export { integrityRouter };
