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

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; teacherEmail?: string }) =>
      api.post<AdminClass>("/v1/admin/classes", input as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "classes"] }),
  });
}

export interface InviteResult {
  id: string;
  name: string;
  email: string;
  role: string;
  tempPassword: string;
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      role: "STUDENT" | "TEACHER" | "ADMIN";
      gradeLevel?: number;
      classId?: string;
    }) =>
      api.post<InviteResult>("/v1/admin/users/invite", input as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
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

// ─── Principal: outcome reports ──────────────────────────────────────────

export interface PrincipalReports {
  perClass: Array<{
    classId: string;
    className: string;
    teacherName: string;
    members: number;
    assignments: number;
    submissions: number;
    averageScore: number | null;
    completionRate: number | null;
  }>;
  toolUsage: Array<{ tool: string; count: number }>;
  integrity: { total: number; flagged: number; flaggedRatio: number };
}

export function usePrincipalReports() {
  return useQuery({
    queryKey: ["principal", "reports"],
    queryFn: () => api.get<PrincipalReports>("/v1/admin/reports"),
    staleTime: 60_000,
  });
}

// ─── Principal: teacher performance ──────────────────────────────────────

export interface PrincipalTeacher {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  lastActiveAt: string;
  createdAt: string;
  classesCount: number;
  assignmentsCount: number;
  gradedCount: number;
  averageScoreGiven: number | null;
}

export function usePrincipalTeachers() {
  return useQuery({
    queryKey: ["principal", "teachers"],
    queryFn: () =>
      api.get<{ teachers: PrincipalTeacher[] }>("/v1/admin/teachers"),
    staleTime: 60_000,
  });
}

// ─── Principal: school heatmap ───────────────────────────────────────────

export interface HeatmapDay {
  date: string;
  total: number;
  flagged: number;
}

export function usePrincipalHeatmap() {
  return useQuery({
    queryKey: ["principal", "heatmap"],
    queryFn: () => api.get<{ days: HeatmapDay[] }>("/v1/admin/heatmap"),
    staleTime: 5 * 60_000,
  });
}

// ─── Admin: school settings ──────────────────────────────────────────────

export interface SchoolDetail {
  id: string;
  name: string;
  _count: { members: number; classes: number };
}

export function useAdminSchool() {
  return useQuery({
    queryKey: ["admin", "school"],
    queryFn: () => api.get<SchoolDetail>("/v1/admin/school"),
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string }) =>
      api.patch<SchoolDetail>("/v1/admin/school", input as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "school"] }),
  });
}

// ─── Admin: roster bulk import ───────────────────────────────────────────

export interface RosterRow {
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER";
  gradeLevel?: number;
  classId?: string;
}

export interface RosterImportResult {
  created: number;
  updated: number;
  addedToClass: number;
  errors: { email: string; reason: string }[];
}

export function useRosterImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: RosterRow[]) =>
      api.post<RosterImportResult>("/v1/admin/roster-import", { rows }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

// ─── Admin: tool catalog ─────────────────────────────────────────────────

export interface AdminTool {
  id: string;
  name: string;
  category: string;
  description: string;
  logoUrl: string;
  websiteUrl?: string | null;
  brandColor: string;
  useCases: string[];
  subjects: string[];
  howTo?: string[];
  examplePrompts?: string[];
  proTips?: string[];
  usageCount: number;
}

export function useAdminTools() {
  return useQuery({
    queryKey: ["admin", "tools"],
    queryFn: () => api.get<{ tools: AdminTool[] }>("/v1/admin/tools"),
  });
}

export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<AdminTool>) =>
      api.post<AdminTool>("/v1/admin/tools", input as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tools"] }),
  });
}

export function useUpdateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<AdminTool> & { id: string }) =>
      api.patch<AdminTool>(`/v1/admin/tools/${id}`, input as Record<string, unknown>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tools"] }),
  });
}

export function useDeleteTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/admin/tools/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tools"] }),
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
