import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@web/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────

export interface TeacherClass {
  id: string;
  name: string;
  schoolId: string;
  teacherId: string;
  createdAt: string;
  _count?: { assignments: number; members: number };
}

export interface TeacherDashboard {
  activeAssignments: number;
  pendingSubmissions: number;
  totalStudents: number;
  averageGrade: number | null;
  completionRate: number;
  classInfo: TeacherClass[];
  recentSubmissions: PendingSubmission[];
}

export interface PendingSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentImage: string | null;
  assignmentId: string;
  assignmentTitle: string;
  submittedAt: string;
  status: string;
  score: number | null;
  grade: string | null;
  xpAwarded: number | null;
}

export interface ClassDetail {
  id: string;
  name: string;
  assignments: AssignmentSummary[];
  memberStats: StudentStats[];
}

export interface AssignmentSummary {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  xpReward: number;
  _count: { submissions: number };
  suggestedTool: { id: string; name: string } | null;
}

export interface StudentStats {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  gradeLevel: number | null;
  studentId: string | null;
  submissionsCount: number;
  completedCount: number;
  avgScore: number | null;
  totalXPEarned: number;
}

export interface Submission {
  id: string;
  studentId: string;
  assignmentId: string;
  fileUrls: string[];
  studentNotes: string | null;
  status: string;
  score: number | null;
  grade: string | null;
  feedback: string | null;
  xpAwarded: number | null;
  submittedAt: string;
  gradedAt: string | null;
  student: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  assignment: {
    id: string;
    title: string;
    xpReward: number;
    class: { id: string; name: string; teacherId: string };
    suggestedTool: { name: string; logoUrl: string } | null;
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ["teacher", "dashboard"],
    queryFn: () => api.get<TeacherDashboard>("/v1/teacher/dashboard"),
    staleTime: 30_000,
  });
}

export function useTeacherClasses() {
  return useQuery({
    queryKey: ["teacher", "classes"],
    queryFn: () => api.get<TeacherClass[]>("/v1/teacher/classes"),
    staleTime: 60_000,
  });
}

export function useClassDetail(classId: string) {
  return useQuery({
    queryKey: ["teacher", "classes", classId],
    queryFn: () => api.get<ClassDetail>(`/v1/teacher/classes/${classId}`),
    enabled: !!classId,
    staleTime: 30_000,
  });
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ["submissions", "assignment", assignmentId],
    queryFn: () => api.get<Submission[]>(`/v1/submissions/assignment/${assignmentId}`),
    enabled: !!assignmentId,
    staleTime: 15_000,
  });
}

export function useSubmission(submissionId: string) {
  return useQuery({
    queryKey: ["submissions", submissionId],
    queryFn: () => api.get<Submission>(`/v1/submissions/${submissionId}`),
    enabled: !!submissionId,
  });
}

// ─── Integrity report (AI misuse detection) ──────────────────────────────

export interface IntegrityInteraction {
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
}

export interface SubmissionIntegrityReport {
  submission: {
    id: string;
    student: { id: string; name: string | null; email: string | null };
    assignmentId: string;
    assignmentTitle: string;
    submittedAt: string;
    score: number | null;
    grade: string | null;
  };
  aiInteractions: IntegrityInteraction[];
  stats: {
    interactionsForAssignment: number;
    flaggedForAssignment: number;
    flaggedAllTimeForStudent: number;
  };
}

export function useSubmissionIntegrity(submissionId: string) {
  return useQuery({
    queryKey: ["integrity", "submission", submissionId],
    queryFn: () =>
      api.get<SubmissionIntegrityReport>(
        `/v1/integrity/submission/${submissionId}`,
      ),
    enabled: !!submissionId,
    staleTime: 60_000,
  });
}

// ─── Class-wide integrity feed (teacher) ─────────────────────────────────

export interface IntegrityFeedEntry {
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

export interface IntegrityFeedResponse {
  logs: IntegrityFeedEntry[];
  total: number;
}

export function useClassIntegrityFeed(
  classId: string | undefined,
  page = 1,
  limit = 30,
) {
  return useQuery({
    queryKey: ["integrity", "class", classId, page, limit],
    queryFn: () =>
      api.get<IntegrityFeedResponse>(
        `/v1/integrity/class/${classId}?page=${page}&limit=${limit}`,
      ),
    enabled: !!classId,
    staleTime: 30_000,
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: string;
      data: {
        score: number;
        grade: string;
        feedback: string;
        // Server computes total XP from score; this is a bounded bonus
        // (0..50) the teacher can add. See computeGradeXp on the API.
        teacherBonusXp?: number;
      };
    }) => api.patch(`/v1/submissions/${submissionId}/grade`, data as Record<string, unknown>),
    onSuccess: (_, { submissionId }) => {
      qc.invalidateQueries({ queryKey: ["submissions", submissionId] });
      qc.invalidateQueries({ queryKey: ["teacher", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["submissions", "assignment"] });
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      classId: string;
      suggestedToolId?: string;
      dueDate: string;
      xpReward: number;
      earlyBonus: number;
    }) => api.post("/v1/assignments", data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["teacher", "dashboard"] });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete(`/v1/assignments/${assignmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["teacher"] });
    },
  });
}
