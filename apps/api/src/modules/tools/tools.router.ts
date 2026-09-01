import express from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  handleListTools,
  handleGetTool,
  handleTrackToolUsage,
} from "./tools.controller.js";

const toolsRouter = express.Router();

// All tool endpoints require authentication
toolsRouter.use(authenticate);

// Tool listing
toolsRouter.get("/", handleListTools);

// Tool detail
toolsRouter.get("/:id", handleGetTool);

// Usage tracking — fired when a student opens the tool
toolsRouter.post("/:id/track", handleTrackToolUsage);

export { toolsRouter };
