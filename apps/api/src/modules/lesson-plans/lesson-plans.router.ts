import express from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import {
  handleListLessonPlans,
  handleGetLessonPlan,
  handleCreateLessonPlan,
  handleMarkLessonPlanUsed,
} from "./lesson-plans.controller.js";

const lessonPlansRouter = express.Router();

// Read access: any authenticated user (teachers browse; students can
// potentially see the plan a teacher assigned to understand its
// structure). No sensitive data in a plan, so we don't need finer ACLs.
lessonPlansRouter.use(authenticate);

lessonPlansRouter.get("/", handleListLessonPlans);
lessonPlansRouter.get("/:idOrSlug", handleGetLessonPlan);

// Teachers can author their own plans + use existing ones.
lessonPlansRouter.post("/", requireRole("TEACHER"), handleCreateLessonPlan);
lessonPlansRouter.post(
  "/:id/use",
  requireRole("TEACHER"),
  handleMarkLessonPlanUsed,
);

export { lessonPlansRouter };
