import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@web/lib/api";

// ─── User management ─────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  onboardingStatus: string;
  gradeLevel: number | null;
  schoolId: string | null;
  image: string | null;
  createdAt: string;
  lastActiveAt: string;
}

export function useAdminUsers(opts: {
  role?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (opts.role) params.set("role", opts.role);
  if (opts.q) params.set("q", opts.q);
  if (opts.page) params.set("page", String(opts.page));
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ["admin", "users", opts],
    queryFn: () =>
      api.get<{ users: AdminUser[]; total: number }>(
        `/v1/admin/users${qs ? `?${qs}` : ""}`,
      ),
    staleTime: 15_000,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/v1/admin/users/${userId}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// ─── Class management ───────────────────────────────────────────────────

export interface AdminClass {
  id: string;
  name: string;
  schoolId: string | null;
  teacherId: string;
  teacher: { id: string; name: string | null; email: string | null } | null;
  createdAt: string;
  _count?: { members: number; assignments: number };
}

export function useAdminClasses(opts: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.page) params.set("page", String(opts.page));
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ["admin", "classes", opts],
    queryFn: () =>
      api.get<{ classes: AdminClass[]; total: number }>(
        `/v1/admin/classes${qs ? `?${qs}` : ""}`,
      ),
    staleTime: 15_000,
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) =>
      api.delete(`/v1/admin/classes/${classId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "classes"] }),
  });
}

// ─── Types ────────────────────────────────────────────────────────────────

export interface SchoolOverview {
  school: { id: string; name: string };
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAssignments: number;
  totalSubmissions: number;
  recentSubmissions: number;
  averageScore: number | null;
  gradedCount: number;
  auditLogs: {
    total: number;
    flagged: number;
  };
}

export interface AuditLogEntry {
  id: string;
  studentId: string;
  promptText: string;
  aiResponse: string;
  toolUsed: string;
  isFlagged: boolean;
  timestamp: string;
  createdAt: string;
  student: {
    id: string;
    name: string | null;
    email: string | null;
    gradeLevel: number | null;
  };
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
}

// ─── Hooks ────────────────────────────────────────────────────────────────

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => api.get<SchoolOverview>("/v1/admin/overview"),
    staleTime: 30_000,
    retry: 2,
  });
}

export function useAuditLogs(options?: {
  limit?: number;
  offset?: number;
  flagged?: boolean;
}) {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));
  if (options?.flagged !== undefined) params.set("flagged", String(options.flagged));

  const qs = params.toString();
  const path = `/v1/admin/audit-logs${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: ["admin", "audit-logs", options],
    queryFn: () => api.get<AuditLogsResponse>(path),
    staleTime: 15_000,
    retry: 2,
  });
}

// ─── School-wide integrity feed (admin / principal) ──────────────────────

export interface SchoolIntegrityEntry {
  id: string;
  toolUsed: string;
  promptText: string;
  aiResponse: string;
  flagReasons: string[];
  flagDescriptions: string[];
  promptLength: number;
  responseLength: number;
  source: string;
  timestamp: string;
  student: { id: string; name: string | null; email: string | null };
  assignment: { id: string; title: string } | null;
}

export interface SchoolIntegrityResponse {
  logs: SchoolIntegrityEntry[];
  total: number;
}

export function useSchoolIntegrityFeed(
  opts: { studentId?: string; page?: number; limit?: number } = {},
) {
  const params = new URLSearchParams();
  if (opts.studentId) params.set("studentId", opts.studentId);
  if (opts.page) params.set("page", String(opts.page));
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ["integrity", "school", opts],
    queryFn: () =>
      api.get<SchoolIntegrityResponse>(
        `/v1/integrity/school${qs ? `?${qs}` : ""}`,
      ),
    staleTime: 30_000,
  });
}

// ─── Per-student AI history (admin / principal) ──────────────────────────

export interface StudentIntegrityEntry {
  id: string;
  toolUsed: string;
  promptText: string;
  aiResponse: string;
  flagReasons: string[];
  flagDescriptions: string[];
  isFlagged: boolean;
  promptLength: number;
  responseLength: number;
  source: string;
  timestamp: string;
  assignment: { id: string; title: string } | null;
}

export interface StudentIntegrityHistory {
  student: { id: string; name: string | null; email: string | null };
  stats: { total: number; flagged: number };
  logs: StudentIntegrityEntry[];
}

export function useStudentIntegrityHistory(
  studentId: string | undefined,
  page = 1,
  limit = 50,
) {
  return useQuery({
    queryKey: ["integrity", "student", studentId, page, limit],
    queryFn: () =>
      api.get<StudentIntegrityHistory>(
        `/v1/integrity/student/${studentId}?page=${page}&limit=${limit}`,
      ),
    enabled: !!studentId,
    staleTime: 30_000,
  });
}
