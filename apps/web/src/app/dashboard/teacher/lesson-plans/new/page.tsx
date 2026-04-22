"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@web/lib/api";

interface AiActivityForm {
  step: number;
  instruction: string;
  suggestedPrompt: string;
  expectedLearning: string;
  timeMinutes: number;
}

const SUBJECTS = [
  "Science",
  "Mathematics",
  "English",
  "History",
  "Geography",
  "Biology",
  "Physics",
  "Chemistry",
  "Hindi",
  "Computer Science",
  "Civics",
  "Other",
];
const BOARDS = ["CBSE", "ICSE", "IB", "State", "All"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

export default function NewLessonPlanPage() {
  const router = useRouter();

  // Basic
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [subject, setSubject] = useState("Science");
  const [gradeLevel, setGradeLevel] = useState(9);
  const [board, setBoard] = useState("CBSE");
  const [chapter, setChapter] = useState("");
  const [duration, setDuration] = useState(45);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [activities, setActivities] = useState<AiActivityForm[]>([
    {
      step: 1,
      instruction: "",
      suggestedPrompt: "",
      expectedLearning: "",
      timeMinutes: 10,
    },
  ]);
  const [tags, setTags] = useState("");

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<{ id: string; slug: string }>("/v1/lesson-plans", payload),
  });

  // Slug auto-fill from title
  const onTitleChange = useCallback((v: string) => {
    setTitle(v);
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(v));
    }
  }, [slug, title]);

  function addObjective() {
    setObjectives((arr) => [...arr, ""]);
  }
  function removeObjective(i: number) {
    setObjectives((arr) => arr.filter((_, idx) => idx !== i));
  }
  function updateObjective(i: number, v: string) {
    setObjectives((arr) => arr.map((o, idx) => (idx === i ? v : o)));
  }

  function addActivity() {
    setActivities((arr) => [
      ...arr,
      {
        step: arr.length + 1,
        instruction: "",
        suggestedPrompt: "",
        expectedLearning: "",
        timeMinutes: 10,
      },
    ]);
  }
  function removeActivity(i: number) {
    setActivities((arr) =>
      arr
        .filter((_, idx) => idx !== i)
        .map((a, idx) => ({ ...a, step: idx + 1 })),
    );
  }
  function updateActivity<K extends keyof AiActivityForm>(
    i: number,
    key: K,
    value: AiActivityForm[K],
  ) {
    setActivities((arr) =>
      arr.map((a, idx) => (idx === i ? { ...a, [key]: value } : a)),
    );
  }

  async function publish() {
    const payload = {
      slug: slug || slugify(title),
      title: title.trim(),
      summary: summary.trim(),
      subject,
      gradeLevel: Number(gradeLevel),
      board,
      chapter: chapter.trim() || undefined,
      durationMinutes: Number(duration),
      difficulty,
      learningObjectives: objectives.map((o) => o.trim()).filter(Boolean),
      aiActivities: activities
        .map((a, idx) => ({
          step: idx + 1,
          instruction: a.instruction.trim(),
          suggestedPrompt: a.suggestedPrompt.trim(),
          expectedLearning: a.expectedLearning.trim(),
          timeMinutes: Number(a.timeMinutes),
        }))
        .filter((a) => a.instruction),
      tags: tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    };
    try {
      const result = await create.mutateAsync(payload);
      router.push(`/dashboard/lesson-plans/${result.slug}`);
    } catch {
      /* shown via create.error */
    }
  }

  const canPublish =
    title.trim().length >= 3 &&
    summary.trim().length >= 10 &&
    objectives.filter((o) => o.trim()).length >= 1 &&
    activities.filter((a) => a.instruction.trim()).length >= 1;

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard/lesson-plans"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to library
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">
              Author a lesson plan
            </h1>
            <p className="text-sm text-foreground-muted">
              Add your plan to the school library so other teachers can find
              and remix it.
            </p>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card space-y-4 p-5"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
          Basics
        </h2>

        <label className="block text-sm">
          <span className="font-medium">
            Title <span className="text-rose-500">*</span>
          </span>
          <input
            type="text"
            className="input-base mt-1 w-full"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. Force and Laws of Motion — Think Like Newton"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Slug</span>
          <input
            type="text"
            className="input-base mt-1 w-full font-mono text-xs"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="auto-generated from title"
          />
          <p className="mt-1 text-[11px] text-foreground-subtle">
            Used in the URL. Lowercase, hyphens only.
          </p>
        </label>

        <label className="block text-sm">
          <span className="font-medium">
            Summary <span className="text-rose-500">*</span>
          </span>
          <textarea
            rows={3}
            className="input-base mt-1 w-full"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="One-paragraph description of the lesson and what students will walk away with."
          />
        </label>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="block text-sm">
            <span className="font-medium">Subject</span>
            <select
              className="input-base mt-1 w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Class</span>
            <select
              className="input-base mt-1 w-full"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Board</span>
            <select
              className="input-base mt-1 w-full"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
            >
              {BOARDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Duration (min)</span>
            <input
              type="number"
              min={5}
              max={300}
              className="input-base mt-1 w-full"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium">Chapter (optional)</span>
          <input
            type="text"
            className="input-base mt-1 w-full"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="e.g. Force and Laws of Motion"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Difficulty</span>
          <div className="mt-1 inline-flex rounded-lg border border-card-border bg-surface/40 p-0.5">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-md px-3 py-1 text-xs font-medium ${
                  difficulty === d
                    ? "bg-accent text-white"
                    : "text-foreground-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Tags (comma separated)</span>
          <input
            type="text"
            className="input-base mt-1 w-full"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="physics, newton, critical-thinking"
          />
        </label>
      </motion.section>

      {/* Learning objectives */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="card space-y-3 p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
            Learning objectives
          </h2>
          <button
            type="button"
            onClick={addObjective}
            className="inline-flex items-center gap-1 text-xs text-accent-light hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {objectives.map((o, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-2"
              >
                <span className="pt-2 text-xs text-foreground-subtle">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  className="input-base flex-1"
                  value={o}
                  onChange={(e) => updateObjective(i, e.target.value)}
                  placeholder="What students will be able to do…"
                />
                {objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(i)}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </motion.section>

      {/* AI activities */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card space-y-3 p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
            Class plan — step by step
          </h2>
          <button
            type="button"
            onClick={addActivity}
            className="inline-flex items-center gap-1 text-xs text-accent-light hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add step
          </button>
        </div>
        <AnimatePresence initial={false}>
          {activities.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-card-border p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-accent-light">
                  Step {i + 1}
                </span>
                {activities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeActivity(i)}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-xs">
                  <span className="font-medium">Instruction</span>
                  <textarea
                    rows={2}
                    className="input-base mt-1 w-full"
                    value={a.instruction}
                    onChange={(e) =>
                      updateActivity(i, "instruction", e.target.value)
                    }
                    placeholder="What the student should do in this step"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-medium">
                    Suggested AI prompt (optional)
                  </span>
                  <textarea
                    rows={2}
                    className="input-base mt-1 w-full font-mono text-[11px]"
                    value={a.suggestedPrompt}
                    onChange={(e) =>
                      updateActivity(i, "suggestedPrompt", e.target.value)
                    }
                    placeholder="A prompt the student can use as a starting point"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs">
                    <span className="font-medium">Expected learning</span>
                    <input
                      type="text"
                      className="input-base mt-1 w-full"
                      value={a.expectedLearning}
                      onChange={(e) =>
                        updateActivity(i, "expectedLearning", e.target.value)
                      }
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-medium">Time (min)</span>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      className="input-base mt-1 w-full"
                      value={a.timeMinutes}
                      onChange={(e) =>
                        updateActivity(
                          i,
                          "timeMinutes",
                          Number(e.target.value),
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.section>

      {/* Publish */}
      <section className="flex items-center justify-end gap-3">
        {create.isError && (
          <p className="text-xs text-rose-600">
            {(create.error as Error)?.message ?? "Couldn’t publish."}
          </p>
        )}
        <button
          onClick={publish}
          disabled={create.isPending || !canPublish}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xl shadow-accent/20 hover:bg-accent-light disabled:opacity-50"
        >
          {create.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Publishing…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Publish plan
            </>
          )}
        </button>
      </section>
    </div>
  );
}
