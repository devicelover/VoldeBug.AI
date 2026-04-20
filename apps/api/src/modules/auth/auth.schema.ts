import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128),
  // Optional for now to keep Google-OAuth flow working; the UI prompts
  // students to fill it in during onboarding. DPDP minor-detection runs
  // once a DOB is supplied.
  dateOfBirth: z
    .string()
    .datetime({ message: "dateOfBirth must be an ISO-8601 timestamp" })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const roleSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RoleInput = z.infer<typeof roleSchema>;
