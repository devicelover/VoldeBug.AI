"use client";

import { Sparkles, Search, Compass, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePromptSuggestions, type PromptSuggestion } from "@web/hooks/use-chat";

// ─── PromptSuggestions ────────────────────────────────────────────────────
//
// Context-aware chip strip that appears on the AI Chat and AI Log pages.
// Clicking a chip either pastes the prompt into the compose box
// (`onPick`) or — when there's no active input — just surfaces the text
// for the student to read.
//
// The suggestions themselves come from the server so lesson-plan prompts
// win over generic ones. This intentionally does not render anything if
// the API is still loading to avoid a layout shift on the chat page.

const KIND_ICON = {
  explore: Compass,
  verify: CheckCircle2,
  feedback: Search,
  reflect: AlertCircle,
} as const;

const KIND_LABEL: Record<PromptSuggestion["kind"], string> = {
  explore: "Explore",
  verify: "Verify",
  feedback: "Feedback",
  reflect: "Reflect",
};

export function PromptSuggestions({
  subject,
  assignmentId,
  onPick,
  compact,
}: {
  subject?: string;
  assignmentId?: string;
  onPick: (prompt: string) => void;
  compact?: boolean;
}) {
  const { data, isLoading } = usePromptSuggestions({ subject, assignmentId });
  const suggestions = data?.suggestions ?? [];

  if (isLoading || suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      {!compact && (
        <p className="flex items-center gap-1 text-xs font-medium text-foreground-muted">
          <Sparkles className="h-3 w-3 text-accent-light" />
          Try a better prompt
          {assignmentId && (
            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-light">
              for this assignment
            </span>
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => {
          const Icon = KIND_ICON[s.kind] ?? Compass;
          const isOfficial = s.source === "lesson_plan";
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(s.prompt)}
              title={s.prompt}
              className={`group inline-flex max-w-xs items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                isOfficial
                  ? "border-accent/30 bg-accent/5 text-accent-light hover:bg-accent/10"
                  : "border-card-border bg-surface/40 text-foreground-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{s.title}</span>
              <span className="hidden shrink-0 rounded bg-white/30 px-1 text-[9px] font-semibold text-foreground-subtle dark:bg-black/20 sm:inline">
                {KIND_LABEL[s.kind]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
