"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Bot,
  Send,
  Clock,
  Hash,
  CheckCircle2,
} from "lucide-react";
import { api } from "@web/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────

interface AiLogEntry {
  id: string;
  toolUsed: string;
  promptText: string;
  promptLength: number;
  responseLength: number;
  flagReasons: string[];
  isFlagged: boolean;
  source: string;
  timestamp: string;
  assignment: { id: string; title: string } | null;
}

interface AiLogList {
  logs: AiLogEntry[];
  total: number;
  page: number;
  limit: number;
}

interface AiLogResponse {
  id: string;
  isFlagged: boolean;
  flagReasons: string[];
  flagDescriptions: string[];
  timestamp: string;
}

const COMMON_TOOLS = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Copilot",
  "Perplexity",
  "Grok",
  "Other",
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AiActivityLogPage() {
  const qc = useQueryClient();
  const [tool, setTool] = useState(COMMON_TOOLS[0]);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [assignmentId, setAssignmentId] = useState<string>("");
  const [lastResult, setLastResult] = useState<AiLogResponse | null>(null);

  // History query
  const history = useQuery({
    queryKey: ["ai-log", "me"],
    queryFn: () => api.get<AiLogList>("/v1/integrity/me?limit=20"),
  });

  // Active assignments to attach the log to (optional). We reuse the
  // student's assignments list — see use-classroom.ts hooks if you want
  // to pre-load. For brevity here, leave it free-text instead.
  // (A future commit can wire this to a real dropdown.)

  const submit = useMutation({
    mutationFn: (input: {
      promptText: string;
      aiResponse: string;
      toolUsed: string;
      assignmentId?: string;
    }) =>
      api.post<AiLogResponse>("/v1/integrity/log", {
        ...input,
        source: "manual_paste",
      }),
    onSuccess: (data) => {
      setLastResult(data);
      setPrompt("");
      setResponse("");
      qc.invalidateQueries({ queryKey: ["ai-log", "me"] });
    },
  });

  const onSubmit = useCallback(() => {
    if (!prompt.trim() || !response.trim()) return;
    submit.mutate({
      promptText: prompt.trim(),
      aiResponse: response.trim(),
      toolUsed: tool,
      assignmentId: assignmentId.trim() || undefined,
    });
  }, [prompt, response, tool, assignmentId, submit]);

  // Auto-clear the success banner after 8s.
  useEffect(() => {
    if (!lastResult) return;
    const t = setTimeout(() => setLastResult(null), 8000);
    return () => clearTimeout(t);
  }, [lastResult]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            AI Activity Log
          </h1>
        </div>
        <p className="text-sm text-zinc-500">
          Be transparent about how you use AI. Logging your prompts and
          responses builds trust with your teacher and trains your own
          academic integrity instincts.
        </p>
      </header>

      {/* ── Why log? ────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-emerald-50 to-sky-50 p-5 dark:border-zinc-800 dark:from-emerald-900/10 dark:to-sky-900/10">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            <p className="font-medium">Why this matters</p>
            <p className="mt-1">
              Voldebug treats AI as a learning tool, not a shortcut. When you
              log how you used AI for an assignment, your teacher can see
              your process and give you better feedback. We flag patterns
              that suggest the AI did the work for you — but logging is
              never punishment, it&rsquo;s the opposite: it shows you&rsquo;re
              learning to use AI responsibly.
            </p>
          </div>
        </div>
      </section>

      {/* ── Submission result ───────────────────────────────────────────── */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-xl border p-4 ${
              lastResult.isFlagged
                ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200"
                : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-200"
            }`}
          >
            <div className="flex items-start gap-2">
              {lastResult.isFlagged ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div className="text-sm">
                <p className="font-medium">
                  {lastResult.isFlagged
                    ? "Logged — and flagged for teacher review"
                    : "Logged — looks clean"}
                </p>
                {lastResult.flagDescriptions.length > 0 && (
                  <ul className="mt-1 list-disc pl-5">
                    {lastResult.flagDescriptions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Capture form ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200/60 bg-white/60 p-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium">AI tool used</span>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={tool}
              onChange={(e) => setTool(e.target.value)}
            >
              {COMMON_TOOLS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium">Linked assignment ID (optional)</span>
            <input
              type="text"
              placeholder="paste an assignment ID"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
            />
          </label>
        </div>

        <label className="mt-4 block text-sm">
          <span className="font-medium">What did you ask the AI?</span>
          <textarea
            rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Paste your prompt here…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="font-medium">What did the AI reply?</span>
          <textarea
            rows={6}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Paste the AI's response here…"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
        </label>

        {submit.isError && (
          <p className="mt-2 text-sm text-red-600">
            {(submit.error as Error)?.message ?? "Failed to log"}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">
          <p className="text-xs text-zinc-500">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Earn XP for transparency (coming soon)
          </p>
          <button
            type="button"
            disabled={submit.isPending || !prompt.trim() || !response.trim()}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submit.isPending ? "Logging…" : "Log this interaction"}
          </button>
        </div>
      </section>

      {/* ── History ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Your recent activity</h2>
          {history.data && (
            <span className="text-xs text-zinc-500">
              {history.data.total} total
            </span>
          )}
        </div>

        {history.isLoading && (
          <p className="text-sm text-zinc-500">Loading…</p>
        )}
        {history.isError && (
          <p className="text-sm text-red-600">
            Couldn&rsquo;t load history.
          </p>
        )}
        {history.data?.logs.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
            Nothing logged yet. Use the form above to log your first AI
            interaction.
          </p>
        )}

        <div className="space-y-2">
          {history.data?.logs.map((log) => (
            <article
              key={log.id}
              className={`rounded-xl border p-4 ${
                log.isFlagged
                  ? "border-amber-300/70 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-900/10"
                  : "border-zinc-200/60 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40"
              }`}
            >
              <header className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {log.toolUsed}
                </span>
                {log.assignment && (
                  <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                    {log.assignment.title}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(log.timestamp)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {log.promptLength} → {log.responseLength} words
                </span>
                {log.isFlagged && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-200/70 px-1.5 py-0.5 font-medium text-amber-900 dark:bg-amber-800/40 dark:text-amber-200">
                    <AlertTriangle className="h-3 w-3" />
                    Flagged
                  </span>
                )}
              </header>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
                {log.promptText}
              </p>
              {log.flagReasons.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-700 dark:text-amber-300">
                  {log.flagReasons.map((r) => (
                    <li key={r}>{r.replace(/_/g, " ")}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
