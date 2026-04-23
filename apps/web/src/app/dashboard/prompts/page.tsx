"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  Copy,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  Compass,
  AlertCircle,
  Zap,
  RefreshCw,
  ListChecks,
  FileText,
} from "lucide-react";
import {
  usePrompts,
  useMarkPromptCopied,
  type PromptRecipe,
  type PromptKind,
} from "@web/hooks/use-prompts";

// ─── Constants ────────────────────────────────────────────────────────────

const KIND_META: Record<
  PromptKind,
  { label: string; Icon: typeof Sparkles; tone: string }
> = {
  EXPLORE: { label: "Explore", Icon: Compass, tone: "text-sky-500 bg-sky-500/10" },
  VERIFY: {
    label: "Verify",
    Icon: CheckCircle2,
    tone: "text-emerald-500 bg-emerald-500/10",
  },
  FEEDBACK: {
    label: "Feedback",
    Icon: Zap,
    tone: "text-amber-500 bg-amber-500/10",
  },
  REFLECT: {
    label: "Reflect",
    Icon: AlertCircle,
    tone: "text-fuchsia-500 bg-fuchsia-500/10",
  },
  PRACTICE: {
    label: "Practice",
    Icon: RefreshCw,
    tone: "text-rose-500 bg-rose-500/10",
  },
  SUMMARIZE: {
    label: "Summarise",
    Icon: ListChecks,
    tone: "text-indigo-500 bg-indigo-500/10",
  },
};

// ─── Card ─────────────────────────────────────────────────────────────────

function PromptCard({
  p,
  onCopied,
}: {
  p: PromptRecipe;
  onCopied: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = KIND_META[p.kind];

  async function copy() {
    try {
      await navigator.clipboard.writeText(p.prompt);
      setCopied(true);
      onCopied(p.id);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card overflow-hidden transition-all ${
        expanded ? "shadow-lg" : "hover:shadow-md"
      }`}
    >
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {p.isOfficial && (
            <span
              title="Voldebug faculty-vetted"
              className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-1.5 py-0.5 font-semibold text-indigo-600"
            >
              <ShieldCheck className="h-3 w-3" />
              Official
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${meta.tone}`}
          >
            <meta.Icon className="h-3 w-3" />
            {meta.label}
          </span>
          <span className="rounded-md bg-surface px-1.5 py-0.5 text-foreground-muted">
            Class {p.gradeLevel} · {p.board} · {p.subject}
          </span>
          {p.chapter && (
            <span className="truncate text-foreground-subtle">
              Ch. {p.chapterNumber ?? "—"} · {p.chapter}
            </span>
          )}
        </div>

        <h3 className="mt-2 font-display text-base font-semibold">{p.title}</h3>
        <p className="mt-1 text-xs text-foreground-muted">{p.description}</p>

        {/* Prompt body — collapsed clamp, full on expand */}
        <div className="mt-3 rounded-lg bg-surface/40 p-3 text-xs">
          <p
            className={`whitespace-pre-wrap font-mono text-foreground/85 ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {p.prompt}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {p.recommendedTool ? (
            <a
              href={p.recommendedTool.websiteUrl ?? "/dashboard/tools"}
              target={p.recommendedTool.websiteUrl ? "_blank" : undefined}
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white"
              style={{ backgroundColor: p.recommendedTool.brandColor }}
            >
              <ExternalLink className="h-3 w-3" />
              Open {p.recommendedTool.name}
            </a>
          ) : (
            <Link
              href="/dashboard/ai-chat"
              className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent-light"
            >
              <Sparkles className="h-3 w-3" />
              Use Voldebug Chat
            </Link>
          )}
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md border border-card-border bg-surface px-2 py-1 text-[11px] font-medium text-foreground-muted hover:bg-surface/70 hover:text-foreground"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy prompt
              </>
            )}
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-foreground-subtle hover:text-foreground"
          >
            {expanded ? "Collapse" : "Expand"}
            <ChevronDown
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {p.copyCount > 0 && (
          <p className="mt-2 text-[10px] text-foreground-subtle">
            Copied {p.copyCount}× by other students
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PromptsLibraryPage() {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [chapter, setChapter] = useState("");
  const [kind, setKind] = useState<PromptKind | "">("");
  const [q, setQ] = useState("");

  const filters = useMemo(
    () => ({
      subject: subject || undefined,
      gradeLevel: grade ? Number(grade) : undefined,
      chapter: chapter || undefined,
      kind: (kind || undefined) as PromptKind | undefined,
      q: q || undefined,
    }),
    [subject, grade, chapter, kind, q],
  );

  const { data, isLoading, isError } = usePrompts(filters);
  const markCopied = useMarkPromptCopied();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-fuchsia-500/10 p-2 text-fuchsia-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold">AI Prompt Library</h1>
        </div>
        <p className="max-w-2xl text-sm text-foreground-muted">
          Ready-to-paste, CBSE-aligned prompts for every chapter. Filter by
          your class, subject, or recommended tool — copy a prompt and use it
          in the AI tool of your choice. Built for ethical AI use, not
          shortcuts.
        </p>
      </header>

      {/* Filters */}
      <section className="card p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Title, prompt, chapter, tag…"
                className="input-base w-full pl-8"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Subject
            </label>
            <select
              className="input-base w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">All</option>
              {data?.facets.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Class
            </label>
            <select
              className="input-base w-full"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">Any</option>
              {data?.facets.gradeLevels.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Kind
            </label>
            <select
              className="input-base w-full"
              value={kind}
              onChange={(e) => setKind(e.target.value as PromptKind | "")}
            >
              <option value="">All</option>
              {Object.entries(KIND_META).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chapter chip row, only when there are chapters available */}
        {data && data.facets.chapters.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-medium text-foreground-subtle">
              Chapter:
            </span>
            <button
              onClick={() => setChapter("")}
              className={`rounded-full px-2 py-0.5 text-[11px] transition-colors ${
                chapter === ""
                  ? "bg-accent text-white"
                  : "bg-surface text-foreground-muted hover:bg-surface/70"
              }`}
            >
              All
            </button>
            {data.facets.chapters.map((c) => (
              <button
                key={c}
                onClick={() => setChapter(c)}
                className={`max-w-xs truncate rounded-full px-2 py-0.5 text-[11px] transition-colors ${
                  chapter === c
                    ? "bg-accent text-white"
                    : "bg-surface text-foreground-muted hover:bg-surface/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Results */}
      <section className="space-y-2">
        {isLoading && (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-44 animate-pulse" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-sm text-rose-600">Couldn&rsquo;t load prompts.</p>
        )}
        {data && data.prompts.length === 0 && (
          <div className="card p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-foreground-subtle" />
            <p className="mt-2 text-sm text-foreground-muted">
              No prompts match these filters.
            </p>
          </div>
        )}
        {data && data.prompts.length > 0 && (
          <>
            <p className="text-xs text-foreground-subtle">
              {data.total} prompt{data.total === 1 ? "" : "s"}
            </p>
            <AnimatePresence mode="popLayout">
              <div className="grid gap-3 md:grid-cols-2">
                {data.prompts.map((p) => (
                  <PromptCard
                    key={p.id}
                    p={p}
                    onCopied={(id) => markCopied.mutate(id)}
                  />
                ))}
              </div>
            </AnimatePresence>
          </>
        )}
      </section>
    </div>
  );
}
