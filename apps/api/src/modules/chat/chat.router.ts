import express from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireParentalConsent } from "../../middleware/consentGate.js";
import rateLimit from "express-rate-limit";
import { handleSend, handleSuggestions } from "./chat.controller.js";

const chatRouter = express.Router();

// Tighter limit than the global 100/15min — LLM calls are expensive and
// also the most abuseable surface (spam prompts). 30 sends / 5 minutes
// is generous for a real student conversation while rate-limiting bots.
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: {
    data: null,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "You're sending messages too quickly. Pause for a moment, then try again.",
    },
    meta: { timestamp: new Date().toISOString() },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All chat endpoints are DPDP-gated for minors — same reason as
// submissions: persistent behavioural data about a child.
chatRouter.use(authenticate, requireParentalConsent);

chatRouter.post("/send", chatLimiter, handleSend);
chatRouter.get("/suggestions", handleSuggestions);

export { chatRouter };
