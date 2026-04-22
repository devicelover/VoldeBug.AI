"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Search,
  ShieldCheck,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useLessonPlans, type LessonPlanSummary } from "@web/hooks/use-lesson-plans";

// ─── Helpers ──────────────────────────────────────────────────────────────

function difficultyBadge(d: "easy" | "medium" | "hard") {
  const map = {
    easy: { label: "Easy", bg: "bg-emerald-500/10", text: "text-emerald-600" },
    medium: { label: "Medium", bg: "bg-amber-500/10", text: "text-amber-600" },
    hard: { label: "Hard", bg: "bg-rose-500/10", text: "text-rose-600" },
  };
  return map[d];
}

// ─── Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, index }: { plan: LessonPlanSummary; index: number }) {
  const diff = difficultyBadge(plan.difficulty);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        href={`/dashboard/lesson-plans/${plan.slug}`}
        className="card group block p-5 transition-all hover:border-card-border-hover hover:shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-accent/10 p-2 text-accent-light">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {plan.isOfficial && (
                <span
                  title="Voldebug faculty-authored"
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-600"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Official
                </span>
              )}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${diff.bg} ${diff.text}`}
              >
                {diff.label}
              </span>
              <span className="text-[11px] text-foreground-subtle">
                Class {plan.gradeLevel} · {plan.board} · {plan.subject}
              </span>
            </div>
            <h3 className="mt-1.5 font-display text-base font-semibold group-hover:text-accent-light transition-colors">
              {plan.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">
              {plan.summary}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-foreground-subtle">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {plan.durationMinutes} min
              </span>
              {plan.usageCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Used {plan.usageCount}×
                </span>
              )}
              {plan.suggestedTool && (
                <span
                  className="inline-flex items-center gap-1"
                  style={{ color: plan.suggestedTool.brandColor }}
                >
                  <Sparkles className="h-3 w-3" />
                  {plan.suggestedTool.name}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-foreground-subtle group-hover:text-foreground transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────

export default function LessonPlansPage() {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [board, setBoard] = useState("");
  const [q, setQ] = useState("");

  const filters = useMemo(
    () => ({
      subject: subject || undefined,
      gradeLevel: grade ? Number(grade) : undefined,
      board: board || undefined,
      q: q || undefined,
    }),
    [subject, grade, board, q],
  );

  const { data, isLoading, isError } = useLessonPlans(filters);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2 text-accent-light">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold">Lesson Plan Library</h1>
          <Link
            href="/dashboard/teacher/lesson-plans/new"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-accent-light"
          >
            + Author a plan
          </Link>
        </div>
        <p className="text-sm text-foreground-muted">
          NCERT-aligned lesson plans with AI integration baked in. Click any
          plan to preview, then use it to create a graded assignment in one
          click.
        </p>
      </header>

      {/* Filters */}
      <section className="card p-4">
        <div className="grid gap-3 md:grid-cols-4">
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
                placeholder="Title, chapter, or tag…"
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
              <option value="">All subjects</option>
              {data?.facets.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
                Board
              </label>
              <select
                className="input-base w-full"
                value={board}
                onChange={(e) => setBoard(e.target.value)}
              >
                <option value="">Any</option>
                {data?.facets.boards.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="space-y-3">
        {isLoading && (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-36 animate-pulse" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-sm text-rose-600">Couldn&rsquo;t load lesson plans.</p>
        )}
        {data && data.plans.length === 0 && (
          <div className="card p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-foreground-subtle" />
            <p className="mt-2 text-sm text-foreground-muted">
              No lesson plans match these filters.
            </p>
          </div>
        )}
        {data && data.plans.length > 0 && (
          <>
            <p className="text-xs text-foreground-subtle">
              {data.total} plan{data.total === 1 ? "" : "s"}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {data.plans.map((p, i) => (
                <PlanCard key={p.id} plan={p} index={i} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
