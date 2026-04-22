import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@web/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────

export interface Tool {
  id: string;
  name: string;
  category: "CHAT_AI" | "CODE_AI" | "IMAGE_AI" | "WRITING_AI" | "RESEARCH_AI";
  description: string;
  logoUrl: string;
  brandColor: string;
  websiteUrl: string | null;
  useCases: string[];
  subjects: string[];
  // Rich content surfaced on the tool detail page. All optional from the
  // client's POV — pages should handle empty arrays gracefully.
  howTo: string[];
  examplePrompts: string[];
  proTips: string[];
  usageCount: number;
  createdAt: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────

export function useTools(params?: { category?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["tools", params?.category, params?.search],
    queryFn: () => api.get<Tool[]>(`/v1/tools${qs ? `?${qs}` : ""}`),
    staleTime: 5 * 60_000,
  });
}

export function useTool(id: string) {
  return useQuery({
    queryKey: ["tools", id],
    queryFn: () => api.get<Tool>(`/v1/tools/${id}`),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

export function useTrackToolUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string) =>
      api.post<{ success: boolean }>(`/v1/tools/${toolId}/track`, {}),
    onSuccess: (_, toolId) => {
      qc.invalidateQueries({ queryKey: ["tools", toolId] });
    },
  });
}
