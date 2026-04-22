"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  ShieldCheck,
  Clock,
  Target,
  ListChecks,
  Sparkles,
  ChevronLeft,
  PlayCircle,
  LinkIcon,
  FileText,
  Video,
  Award,
} from "lucide-react";
import {
  useLessonPlan,
  useMarkPlanUsed,
  useDeleteLessonPlan,
} from "@web/hooks/use-lesson-plans";
import { useMe } from "@web/hooks/use-me";

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LessonPlanDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: plan, isLoading, isError } = useLessonPlan(params.slug);
  const me = useMe();
  const usePlan = useMarkPlanUsed();
  const deletePlan = useDeleteLessonPlan();
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!plan) return;
    const confirmed = window.confirm(
      `Delete "${plan.title}"? This can't be undone.`,
    );
    if (!confirmed) return;
    try {
      await deletePlan.mutateAsync(plan.id);
      router.push("/dashboard/lesson-plans");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const canDelete = !!(
    plan &&
    me.data &&
    // Teacher owns it, OR admin, OR admin && not official (admin can
    // clean up unofficial user content even if not authored by them).
    ((plan.author?.id === me.data.id && !plan.isOfficial) ||
      (me.data.role === "ADMIN" && !plan.isOfficial))
  );

  async function onUse() {
    if (!plan) return;
    setError(null);
    try {
      const result = await usePlan.mutateAsync(plan.id);
      // Stash the prefill in sessionStorage so the create-assignment
      // page can pick it up without sending state through the URL.
      sessionStorage.setItem(
        "lesson-plan-prefill",
        JSON.stringify(result.assignmentPrefill),
      );
      if (result.assignmentPrefill.suggestedToolId) {
        sessionStorage.setItem(
          "lesson-plan-suggested-tool-id",
          result.assignmentPrefill.suggestedToolId,
        );
      }
      router.push("/dashboard/teacher/create-assignment?from-plan=1");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-surface" />
        <div className="card h-40 animate-pulse" />
        <div className="card h-64 animate-pulse" />
      </div>
    );
  }
  if (isError || !plan) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center">
        <p className="font-display text-lg">Lesson plan not found</p>
        <Link
          href="/dashboard/lesson-plans"
          className="mt-2 inline-block text-sm text-accent-light hover:underline"
        >
          Back to library
        </Link>
      </div>
    );
  }

  const resourceIcon = {
    link: LinkIcon,
    pdf: FileText,
    video: Video,
  } as const;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to library
      </button>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {plan.isOfficial && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-1 font-semibold text-indigo-600">
              <ShieldCheck className="h-3 w-3" />
              Voldebug Faculty
            </span>
          )}
          <span className="rounded-md bg-surface px-2 py-1 text-foreground-muted">
            Class {plan.gradeLevel} · {plan.board}
          </span>
          <span className="rounded-md bg-surface px-2 py-1 text-foreground-muted">
            {plan.subject}
            {plan.chapter ? ` · ${plan.chapter}` : ""}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-foreground-muted">
            <Clock className="h-3 w-3" />
            {plan.durationMinutes} min
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold">{plan.title}</h1>
        <p className="text-foreground-muted">{plan.summary}</p>
      </motion.header>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="card flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p className="font-medium">Use this plan as an assignment</p>
          <p className="text-xs text-foreground-muted">
            We&rsquo;ll pre-fill the Create Assignment form with this plan&rsquo;s
            title, instructions, suggested tool, and default due-date (7 days
            from now).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onUse}
            disabled={usePlan.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-xl shadow-accent/20 hover:bg-accent-light disabled:opacity-60"
          >
            {usePlan.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Preparing…
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Use this plan
              </>
            )}
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              disabled={deletePlan.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300"
            >
              {deletePlan.isPending ? "Deleting…" : "Delete plan"}
            </button>
          )}
        </div>
      </motion.section>

      {error && (
        <p className="text-sm text-rose-600">{error}</p>
      )}

      {/* Learning objectives */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-5"
      >
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
          <Target className="h-4 w-4 text-accent-light" />
          Learning objectives
        </h2>
        <ul className="space-y-1.5 text-sm">
          {plan.learningObjectives.map((obj, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-foreground-subtle">{i + 1}.</span>
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* AI activities */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-5"
      >
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
          <ListChecks className="h-4 w-4 text-accent-light" />
          Class plan — {plan.aiActivities.length} steps
        </h2>
        <ol className="space-y-4">
          {plan.aiActivities.map((act) => (
            <li key={act.step} className="relative pl-8">
              <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent-light">
                {act.step}
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="inline-flex items-center gap-1 text-[11px] text-foreground-subtle">
                    <Clock className="h-3 w-3" />
                    {act.timeMinutes} min
                  </span>
                </p>
                <p className="text-sm leading-relaxed">{act.instruction}</p>
                {act.suggestedPrompt && (
                  <div className="rounded-lg bg-surface/60 p-3 text-xs">
                    <p className="mb-1 font-semibold text-foreground-muted">
                      Suggested prompt
                    </p>
                    <code className="block whitespace-pre-wrap font-mono text-[12px] text-foreground/80">
                      {act.suggestedPrompt}
                    </code>
                  </div>
                )}
                <p className="text-[11px] italic text-foreground-subtle">
                  Expected learning: {act.expectedLearning}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* Suggested tool */}
      {plan.suggestedTool && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <Sparkles className="h-4 w-4 text-accent-light" />
            Suggested tool
          </h2>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg"
              style={{ backgroundColor: plan.suggestedTool.brandColor }}
            />
            <div>
              <p className="font-semibold">{plan.suggestedTool.name}</p>
              {plan.suggestedTool.description && (
                <p className="text-xs text-foreground-muted">
                  {plan.suggestedTool.description}
                </p>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Resources */}
      {plan.resources.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5"
        >
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <LinkIcon className="h-4 w-4 text-accent-light" />
            Resources
          </h2>
          <ul className="space-y-2">
            {plan.resources.map((r, i) => {
              const Icon = resourceIcon[r.type] ?? LinkIcon;
              return (
                <li key={i}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-card-border p-2.5 text-sm hover:bg-surface/40"
                  >
                    <Icon className="h-4 w-4 text-foreground-subtle" />
                    <span>{r.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      {/* Rubric */}
      {plan.rubricTemplate && plan.rubricTemplate.criteria.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <Award className="h-4 w-4 text-accent-light" />
            Grading rubric
          </h2>
          <div className="space-y-3">
            {plan.rubricTemplate.criteria.map((c, i) => (
              <div key={i} className="rounded-lg border border-card-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <span className="text-xs text-foreground-subtle">
                    {c.weight}%
                  </span>
                </div>
                <div className="mt-2 grid gap-1 text-[11px] md:grid-cols-3">
                  <p>
                    <span className="font-semibold text-emerald-600">
                      Excellent:
                    </span>{" "}
                    {c.descriptors.excellent}
                  </p>
                  <p>
                    <span className="font-semibold text-sky-600">Good:</span>{" "}
                    {c.descriptors.good}
                  </p>
                  <p>
                    <span className="font-semibold text-rose-600">
                      Needs work:
                    </span>{" "}
                    {c.descriptors.needs_work}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
