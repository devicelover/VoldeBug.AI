import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@web/lib/api";

export type PromptKind =
  | "EXPLORE"
  | "VERIFY"
  | "FEEDBACK"
  | "REFLECT"
  | "PRACTICE"
  | "SUMMARIZE";

export interface PromptRecipe {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  description: string;
  subject: string;
  gradeLevel: number;
  board: string;
  chapter: string | null;
  chapterNumber: number | null;
  topic: string | null;
  kind: PromptKind;
  recommendedToolId: string | null;
  recommendedTool: {
    id: string;
    name: string;
    brandColor: string;
    category: string;
    websiteUrl: string | null;
  } | null;
  tags: string[];
  isOfficial: boolean;
  usageCount: number;
  copyCount: number;
  createdAt: string;
}

export interface PromptListResponse {
  prompts: PromptRecipe[];
  total: number;
  facets: {
    subjects: string[];
    gradeLevels: number[];
    boards: string[];
    chapters: string[];
  };
}

export interface PromptListFilters {
  subject?: string;
  gradeLevel?: number;
  board?: string;
  chapter?: string;
  toolId?: string;
  kind?: PromptKind;
  q?: string;
  page?: number;
  limit?: number;
}

function toQuery(f: PromptListFilters): string {
  const p = new URLSearchParams();
  if (f.subject) p.set("subject", f.subject);
  if (f.gradeLevel) p.set("gradeLevel", String(f.gradeLevel));
  if (f.board) p.set("board", f.board);
  if (f.chapter) p.set("chapter", f.chapter);
  if (f.toolId) p.set("toolId", f.toolId);
  if (f.kind) p.set("kind", f.kind);
  if (f.q) p.set("q", f.q);
  if (f.page) p.set("page", String(f.page));
  if (f.limit) p.set("limit", String(f.limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function usePrompts(filters: PromptListFilters = {}) {
  return useQuery({
    queryKey: ["prompts", filters],
    queryFn: () =>
      api.get<PromptListResponse>(`/v1/prompts${toQuery(filters)}`),
    staleTime: 60_000,
  });
}

export function useMarkPromptCopied() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ id: string }>(`/v1/prompts/${id}/copy`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompts"] }),
  });
}

export function useMarkPromptUsed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ id: string }>(`/v1/prompts/${id}/use`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompts"] }),
  });
}
