import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@web/lib/api";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface PromptSuggestion {
  title: string;
  prompt: string;
  kind: "explore" | "verify" | "feedback" | "reflect";
  source: "lesson_plan" | "curated";
}

export interface ChatSendResponse {
  reply: ChatMessage;
  provider: string;
  model: string | null;
  integrity: {
    id: string;
    isFlagged: boolean;
    flagReasons: string[];
  };
}

export function useSendChat() {
  return useMutation({
    mutationFn: (input: {
      messages: ChatMessage[];
      assignmentId?: string;
      mode?: "default" | "socratic";
    }) => api.post<ChatSendResponse>("/v1/chat/send", input),
  });
}

export function usePromptSuggestions(opts: {
  subject?: string;
  assignmentId?: string;
}) {
  const params = new URLSearchParams();
  if (opts.subject) params.set("subject", opts.subject);
  if (opts.assignmentId) params.set("assignmentId", opts.assignmentId);
  const q = params.toString();
  return useQuery({
    queryKey: ["prompt-suggestions", opts.subject, opts.assignmentId],
    queryFn: () =>
      api.get<{ suggestions: PromptSuggestion[] }>(
        `/v1/chat/suggestions${q ? `?${q}` : ""}`,
      ),
    staleTime: 5 * 60_000,
  });
}
