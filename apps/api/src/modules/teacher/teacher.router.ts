import express from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import {
  handleTeacherDashboard,
  handleTeacherClasses,
  handleTeacherClassDetail,
  handleTeacherAllStudents,
  handleTeacherStudent,
} from "./teacher.controller.js";

const teacherRouter = express.Router();

teacherRouter.use(authenticate, requireRole("TEACHER"));

teacherRouter.get("/dashboard", handleTeacherDashboard);
teacherRouter.get("/classes", handleTeacherClasses);
teacherRouter.get("/classes/:classId", handleTeacherClassDetail);
teacherRouter.get("/students", handleTeacherAllStudents);
teacherRouter.get("/student/:studentId", handleTeacherStudent);

export { teacherRouter };
