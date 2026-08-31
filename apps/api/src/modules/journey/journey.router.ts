import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/auth.js";
import {
  handleAddCreation,
  handleDeleteCreation,
  handleGetMe,
  handleLeaderboard,
  handleOnboard,
  handlePostEvents,
  handleTimeline,
  handleListCreations,
} from "./journey.controller.js";

const journeyRouter = express.Router();

journeyRouter.use(authenticate);

// Whole classrooms share one NAT IP, so the global per-IP limiter would let
// one student 429 the room. Key by authenticated user instead.
const journeyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 120,
  keyGenerator: (req) => req.userId ?? req.ip ?? "anonymous",
  message: {
    data: null,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Take a short break and try again.",
    },
    meta: { timestamp: new Date().toISOString() },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
journeyRouter.use(journeyLimiter);

journeyRouter.get("/me", handleGetMe);
journeyRouter.post("/onboard", handleOnboard);
journeyRouter.post("/events", handlePostEvents);
journeyRouter.get("/creations", handleListCreations);
journeyRouter.post("/creations", handleAddCreation);
journeyRouter.delete("/creations/:id", handleDeleteCreation);
journeyRouter.get("/leaderboard", handleLeaderboard);
journeyRouter.get("/timeline", handleTimeline);

export { journeyRouter };
