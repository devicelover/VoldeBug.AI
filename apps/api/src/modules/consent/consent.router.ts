import express from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  handleGetMyConsent,
  handleRequestConsent,
  handleViewConsent,
  handleSubmitConsent,
} from "./consent.controller.js";

const consentRouter = express.Router();

// ─── Authenticated (student) endpoints ────────────────────────────────────
consentRouter.get("/me", authenticate, handleGetMyConsent);
consentRouter.post("/request", authenticate, handleRequestConsent);

// ─── Public endpoints (parent clicks an email link) ──────────────────────
// No authentication — the token IS the credential. The token is
// single-use and expires; see consent.service.ts for rules.
consentRouter.get("/:token", handleViewConsent);
consentRouter.post("/:token", handleSubmitConsent);

export { consentRouter };
