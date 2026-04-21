"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Bot,
  Hash,
  User as UserIcon,
  FileText,
} from "lucide-react";

// ─── Shared integrity-feed renderer ───────────────────────────────────────
// Used by BOTH the teacher class feed and the principal school feed.
// Accepts an already-fetched list so each caller controls its own filters,
// pagination, and empty state.

export interface FeedEntry {
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

export function IntegrityFeedList({
  entries,
  showStudent = true,
}: {
  entries: FeedEntry[];
  showStudent?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <AlertTriangle className="h-8 w-8 text-foreground-subtle" />
        <p className="text-sm text-foreground-muted">
          No flagged AI interactions yet. 🎉
        </p>
        <p className="text-xs text-foreground-subtle">
          Either students are using AI ethically, or they haven&apos;t logged
          anything here yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((log) => {
        const expanded = expandedId === log.id;
        return (
          <motion.li
            key={log.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="card overflow-hidden border-warning/30 bg-warning/5"
          >
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : log.id)}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              {showStudent && (
                <div className="flex min-w-0 shrink-0 items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent-light">
                    {log.student.name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {log.student.name ?? "Unknown"}
                    </p>
                    <p className="truncate text-[11px] text-foreground-subtle">
                      {log.student.email}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <span className="rounded border border-card-border bg-surface px-1.5 py-0.5 text-[11px] font-semibold">
                  {log.toolUsed}
                </span>
                {log.assignment && (
                  <span className="inline-flex max-w-xs items-center gap-1 truncate rounded bg-sky-500/10 px-1.5 py-0.5 text-[11px] text-sky-600">
                    <FileText className="h-3 w-3 shrink-0" />
                    {log.assignment.title}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-foreground-subtle">
                  <Hash className="h-3 w-3" />
                  {log.promptLength} → {log.responseLength} w
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-foreground-subtle">
                  <Clock className="h-3 w-3" />
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              {log.flagReasons.length > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {log.flagReasons.length} flag
                  {log.flagReasons.length > 1 ? "s" : ""}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-foreground-subtle transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden border-t border-card-border"
                >
                  <div className="space-y-3 p-3">
                    {log.flagDescriptions.length > 0 && (
                      <ul className="list-disc space-y-0.5 pl-5 text-xs text-amber-700">
                        {log.flagDescriptions.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    )}
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
                        Prompt
                      </p>
                      <p className="whitespace-pre-wrap text-sm">
                        {log.promptText}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
                        AI response
                      </p>
                      <p className="max-h-60 overflow-y-auto whitespace-pre-wrap text-sm text-foreground-muted">
                        {log.aiResponse}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </ul>
  );
}
