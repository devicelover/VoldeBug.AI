import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./modules/health/health.router.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { usersRouter } from "./modules/users/users.router.js";
import { toolsRouter } from "./modules/tools/tools.router.js";
import { assignmentsRouter } from "./modules/assignments/assignments.router.js";
import { submissionsRouter } from "./modules/submissions/submissions.router.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.router.js";
import { gamificationRouter } from "./modules/gamification/gamification.router.js";
import { teacherRouter } from "./modules/teacher/teacher.router.js";
import { notificationsRouter } from "./modules/notifications/notifications.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";
import { consentRouter } from "./modules/consent/consent.router.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { limiter } from "./middleware/rateLimiter.js";

const app: Express = express();

// Trust the first proxy hop (nginx/CloudPanel) so X-Forwarded-* headers are
// honoured by express-rate-limit, req.ip, and secure-cookie detection.
// CLAUDE.md §4.6 — proxy-aware deployment.
app.set("trust proxy", 1);

app.use(helmet());

// Allowed origins are env-driven so each school deployment / preview branch
// can add its own host without a code change.
const defaultOrigins = [
  "http://localhost:3000",
  "https://ai-voldebug.vercel.app",
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .concat(defaultOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(limiter);

const api = express.Router();
api.use("/health", healthRouter);

api.use("/auth", authRouter);
api.use("/users", usersRouter);
api.use("/tools", toolsRouter);
api.use("/assignments", assignmentsRouter);
api.use("/submissions", submissionsRouter);
api.use("/dashboard", dashboardRouter);
api.use("/gamification", gamificationRouter);
api.use("/teacher", teacherRouter);
api.use("/notifications", notificationsRouter);
api.use("/admin", adminRouter);
api.use("/consent", consentRouter);

app.use("/v1", api);

// ── 404 ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    data: null,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

// ── Error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export { app };
