import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@web/lib/api";

export interface LessonPlanSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  subject: string;
  gradeLevel: number;
  board: string;
  chapter: string | null;
  chapterNumber: number | null;
  difficulty: "easy" | "medium" | "hard";
  durationMinutes: number;
  tags: string[];
  isOfficial: boolean;
  usageCount: number;
  suggestedTool: {
    id: string;
    name: string;
    brandColor: string;
    logoUrl: string;
  } | null;
  createdAt: string;
}

export interface AiActivity {
  step: number;
  instruction: string;
  suggestedPrompt: string;
  expectedLearning: string;
  timeMinutes: number;
}

export interface LessonPlanResource {
  type: "link" | "pdf" | "video";
  title: string;
  url: string;
}

export interface RubricCriterion {
  name: string;
  weight: number;
  descriptors: { excellent: string; good: string; needs_work: string };
}

export interface LessonPlanDetail extends LessonPlanSummary {
  learningObjectives: string[];
  aiActivities: AiActivity[];
  resources: LessonPlanResource[];
  rubricTemplate: { criteria: RubricCriterion[] } | null;
  suggestedTool:
    | (LessonPlanSummary["suggestedTool"] & {
        description?: string;
        category?: string;
      })
    | null;
  author: { id: string; name: string | null; email: string | null } | null;
}

export interface LessonPlanListResponse {
  plans: LessonPlanSummary[];
  total: number;
  facets: {
    subjects: string[];
    gradeLevels: number[];
    boards: string[];
  };
}

export interface LessonPlanFilters {
  subject?: string;
  gradeLevel?: number;
  board?: string;
  q?: string;
  page?: number;
  limit?: number;
}

function toQuery(f: LessonPlanFilters): string {
  const p = new URLSearchParams();
  if (f.subject) p.set("subject", f.subject);
  if (f.gradeLevel) p.set("gradeLevel", String(f.gradeLevel));
  if (f.board) p.set("board", f.board);
  if (f.q) p.set("q", f.q);
  if (f.page) p.set("page", String(f.page));
  if (f.limit) p.set("limit", String(f.limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function useLessonPlans(filters: LessonPlanFilters = {}) {
  return useQuery({
    queryKey: ["lesson-plans", filters],
    queryFn: () =>
      api.get<LessonPlanListResponse>(
        `/v1/lesson-plans${toQuery(filters)}`,
      ),
    staleTime: 60_000,
  });
}

export function useLessonPlan(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ["lesson-plan", idOrSlug],
    queryFn: () => api.get<LessonPlanDetail>(`/v1/lesson-plans/${idOrSlug}`),
    enabled: !!idOrSlug,
  });
}

export interface AssignmentPrefill {
  title: string;
  description: string;
  dueDate: string;
  suggestedToolId: string | null;
  xpReward: number;
  earlyBonus: number;
}

export interface UsePlanResponse {
  plan: LessonPlanDetail;
  assignmentPrefill: AssignmentPrefill;
}

export function useMarkPlanUsed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      api.post<UsePlanResponse>(`/v1/lesson-plans/${planId}/use`),
    onSuccess: (_, planId) => {
      qc.invalidateQueries({ queryKey: ["lesson-plan", planId] });
      qc.invalidateQueries({ queryKey: ["lesson-plans"] });
    },
  });
}

export function useDeleteLessonPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      api.delete(`/v1/lesson-plans/${planId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-plans"] });
    },
  });
}
