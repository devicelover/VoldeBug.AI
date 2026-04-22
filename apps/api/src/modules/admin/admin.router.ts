import express from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import {
  handleGetSchool,
  handleListUsers,
  handleGetUser,
  handleUpdateUserRole,
  handleListClasses,
  handleUpdateClass,
  handleDeleteClass,
  handleGetSchoolOverview,
  handleGetAuditLogs,
  handleListSecurityAuditLogs,
  handlePrincipalReports,
  handlePrincipalTeachers,
  handlePrincipalHeatmap,
} from "./admin.controller.js";

const adminRouter = express.Router();

adminRouter.use(authenticate, requireRole("ADMIN"));

// School
adminRouter.get("/school", handleGetSchool);

// Users
adminRouter.get("/users", handleListUsers);
adminRouter.get("/users/:id", handleGetUser);
adminRouter.patch("/users/:id/role", handleUpdateUserRole);

// Classes
adminRouter.get("/classes", handleListClasses);
adminRouter.patch("/classes/:id", handleUpdateClass);
adminRouter.delete("/classes/:id", handleDeleteClass);

// Principal Dashboard
adminRouter.get("/overview", handleGetSchoolOverview);
adminRouter.get("/audit-logs", handleGetAuditLogs); // AI prompt logs (academic integrity)

// Security audit log: who-did-what to whom — for DPDP/FERPA queries.
adminRouter.get("/security-audit-logs", handleListSecurityAuditLogs);

// Principal-flavoured aggregations
adminRouter.get("/reports", handlePrincipalReports);
adminRouter.get("/teachers", handlePrincipalTeachers);
adminRouter.get("/heatmap", handlePrincipalHeatmap);

export { adminRouter };
