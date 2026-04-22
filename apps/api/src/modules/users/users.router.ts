import express from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  handleStudentOnboarding,
  handleTeacherOnboarding,
  handleUpdateMe,
} from "./users.controller.js";

const usersRouter = express.Router();

// Self-service profile update — anyone authenticated.
usersRouter.patch("/me", authenticate, handleUpdateMe);

// Onboarding finishers
usersRouter.patch("/onboarding/student", authenticate, handleStudentOnboarding);
usersRouter.patch("/onboarding/teacher", authenticate, handleTeacherOnboarding);

export { usersRouter };
