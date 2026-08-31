import type { NextFunction, Request, Response } from "express";
import type { ZodError } from "zod";
import { apiSuccess, apiError } from "../../utils/api.js";
import { creationSchema, eventsBodySchema, onboardSchema } from "./journey.schema.js";
import {
  addCreation,
  deleteCreation,
  getLeaderboard,
  getOrCreateProfile,
  getTimeline,
  listCreations,
  onboardProfile,
  processEvents,
  serializeProfile,
} from "./journey.service.js";

function validationError(res: Response, err: ZodError) {
  const first = err.issues[0];
  const message = first ? `${first.path.join(".")}: ${first.message}` : "Invalid input";
  return apiError(res, { code: "VALIDATION_ERROR", message, status: 422 });
}

export async function handleGetMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const profile = await getOrCreateProfile(userId);
    const [creations, timeline] = await Promise.all([
      listCreations(userId),
      getTimeline(userId),
    ]);
    return apiSuccess(res, { profile: serializeProfile(profile), creations, timeline });
  } catch (err) {
    return next(err);
  }
}

export async function handleOnboard(req: Request, res: Response, next: NextFunction) {
  const parsed = onboardSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const profile = await onboardProfile(req.userId!, parsed.data);
    return apiSuccess(res, { profile });
  } catch (err) {
    return next(err);
  }
}

export async function handlePostEvents(req: Request, res: Response, next: NextFunction) {
  const parsed = eventsBodySchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await processEvents(req.userId!, parsed.data.events);
    return apiSuccess(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function handleAddCreation(req: Request, res: Response, next: NextFunction) {
  const parsed = creationSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await addCreation(req.userId!, parsed.data);
    return apiSuccess(res, result, 201);
  } catch (err) {
    return next(err);
  }
}

export async function handleListCreations(req: Request, res: Response, next: NextFunction) {
  try {
    const creations = await listCreations(req.userId!);
    return apiSuccess(res, { creations });
  } catch (err) {
    return next(err);
  }
}

export async function handleDeleteCreation(req: Request, res: Response, next: NextFunction) {
  try {
    const ok = await deleteCreation(req.userId!, req.params.id);
    if (!ok) {
      return apiError(res, { code: "NOT_FOUND", message: "Creation not found", status: 404 });
    }
    return apiSuccess(res, { ok: true });
  } catch (err) {
    return next(err);
  }
}

export async function handleLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const board = await getLeaderboard(req.userId!);
    return apiSuccess(res, board);
  } catch (err) {
    return next(err);
  }
}

export async function handleTimeline(req: Request, res: Response, next: NextFunction) {
  try {
    const timeline = await getTimeline(req.userId!);
    return apiSuccess(res, { timeline });
  } catch (err) {
    return next(err);
  }
}
