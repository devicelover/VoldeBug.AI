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

// Teachers author their own plans and mark plans as used. Admins can also
// do both — admins in a small school often double as the first teacher,
// and admin dashboards need to be able to exercise these endpoints.
lessonPlansRouter.post(
  "/",
  requireRole("TEACHER", "ADMIN"),
  handleCreateLessonPlan,
);
lessonPlansRouter.post(
  "/:id/use",
  requireRole("TEACHER", "ADMIN"),
  handleMarkLessonPlanUsed,
);

export { lessonPlansRouter };
