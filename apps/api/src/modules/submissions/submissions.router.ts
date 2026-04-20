import express from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import {
  submissionLimiter,
  uploadLimiter,
  gradingLimiter,
} from "../../middleware/rateLimiter.js";
import {
  handleCreateSubmission,
  handleGetSubmission,
  handleGetSubmissionHistory,
  handleGradeSubmission,
  handleListSubmissionsForAssignment,
  handleGetUploadPresignedUrl,
} from "./submissions.controller.js";

const submissionsRouter = express.Router();

submissionsRouter.use(authenticate);

// Student: create submission (write — rate-limited)
submissionsRouter.post("/", submissionLimiter, handleCreateSubmission);

// Student: view own submission history (read)
submissionsRouter.get("/history", handleGetSubmissionHistory);

// Student: get presigned URL for file upload (write — tight rate limit
// because each URL is a short-lived credential for our storage bucket)
submissionsRouter.get("/upload-url", uploadLimiter, handleGetUploadPresignedUrl);

// Student/Teacher: view single submission (ownership enforced in controller)
submissionsRouter.get("/:id", handleGetSubmission);

// Teacher: list submissions for an assignment
submissionsRouter.get(
  "/assignment/:assignmentId",
  requireRole("TEACHER"),
  handleListSubmissionsForAssignment,
);

// Teacher: grade a submission (write — rate-limited)
submissionsRouter.patch(
  "/:id/grade",
  requireRole("TEACHER"),
  gradingLimiter,
  handleGradeSubmission,
);

export { submissionsRouter };
