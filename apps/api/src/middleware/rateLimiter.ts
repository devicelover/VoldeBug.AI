import rateLimit from "express-rate-limit";

// All limits are per-IP. Numbers are deliberately conservative for a
// classroom-scale deployment (~30 active students per class). Tune via
// load testing before scaling beyond a single school.
//
// CLAUDE.md §4.8 ceilings:
//   general: 100 / 15min
//   auth:      5 / 15min
//   upload:   20 / hour
const envelope = (msg: string) => ({
  data: null,
  error: { code: "RATE_LIMIT_EXCEEDED", message: msg },
  meta: { timestamp: new Date().toISOString() },
});

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: envelope("Too many requests, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: envelope("Too many authentication attempts. Please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
});

// Presigned-URL requests and direct uploads. Tight cap because the URLs
// are credentials in disguise and storage is metered.
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: envelope("Too many upload requests this hour. Please wait."),
  standardHeaders: true,
  legacyHeaders: false,
});

// Student submission writes — enough for a productive class period plus
// retries, low enough to keep a single compromised account from spamming.
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: envelope("Too many submission attempts. Please wait."),
  standardHeaders: true,
  legacyHeaders: false,
});

// Teacher grading writes — generous enough for end-of-term grading sprints.
export const gradingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: envelope("Too many grading actions in a short time. Please slow down."),
  standardHeaders: true,
  legacyHeaders: false,
});
