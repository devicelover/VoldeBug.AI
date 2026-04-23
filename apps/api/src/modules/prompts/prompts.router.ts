import express from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import {
  handleListPrompts,
  handleGetPrompt,
  handleCreatePrompt,
  handleMarkPromptUsed,
  handleMarkPromptCopied,
  handleDeletePrompt,
} from "./prompts.controller.js";

const promptsRouter = express.Router();

// Anyone authenticated can browse + use prompts.
promptsRouter.use(authenticate);

promptsRouter.get("/", handleListPrompts);
promptsRouter.get("/:idOrSlug", handleGetPrompt);

// Bumping counters is fire-and-forget for the student/teacher; no role
// check needed beyond authentication.
promptsRouter.post("/:id/use", handleMarkPromptUsed);
promptsRouter.post("/:id/copy", handleMarkPromptCopied);

// Authoring + deletion is teacher/admin.
promptsRouter.post("/", requireRole("TEACHER", "ADMIN"), handleCreatePrompt);
promptsRouter.delete(
  "/:id",
  requireRole("TEACHER", "ADMIN"),
  handleDeletePrompt,
);

export { promptsRouter };
