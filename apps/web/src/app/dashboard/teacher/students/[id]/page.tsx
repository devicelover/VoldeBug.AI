"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Mail,
  GraduationCap,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Bot,
} from "lucide-react";
import { useTeacherStudent } from "@web/hooks/use-teacher";

function timeAgo(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function TeacherStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const studentId = params.id;
  const { data, isLoading, isError } = useTeacherStudent(studentId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <div className="card h-32 animate-pulse" />
        <div className="card h-48 animate-pulse" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="font-display text-lg">Student not accessible</p>
        <Link
          href="/dashboard/teacher/students"
          className="mt-2 inline-block text-sm text-accent-light hover:underline"
        >
          Back to roster
        </Link>
      </div>
    );
  }

  const { student, submissions, flagged, stats } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6 md:p-10">
      <Link
        href="/dashboard/teacher/students"
        className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Back to roster
      </Link>

      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-wrap items-center gap-4 p-5"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-xl font-bold text-accent-light">
          {student.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold">
            {student.name ?? "Student"}
          </h1>
          <p className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {student.email}
            </span>
            {student.gradeLevel && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Class {student.gradeLevel}
              </span>
            )}
            {student.studentId && (
              <span>ID {student.studentId}</span>
            )}
          </p>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="grid gap-3 md:grid-cols-3">
        <Stat
          icon={<FileText className="h-5 w-5" />}
          label="Recent submissions"
          value={stats.submissions}
          tone="sky"
        />
        <Stat
          icon={<Bot className="h-5 w-5" />}
          label="AI interactions logged"
          value={stats.totalAiInteractions}
          tone="violet"
        />
        <Stat
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Flagged"
          value={stats.flaggedAi}
          tone={stats.flaggedAi > 0 ? "amber" : "emerald"}
        />
      </section>

      {/* Submissions */}
      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
          <FileText className="h-4 w-4 text-accent-light" />
          Recent submissions
        </h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            No submissions yet in your classes.
          </p>
        ) : (
          <ul className="space-y-2">
            {submissions.slice(0, 10).map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <Link
                  href={`/dashboard/teacher/grading/${s.id}`}
                  className="flex flex-1 items-center gap-3 rounded-lg p-2 hover:bg-surface/40"
                >
                  <FileText className="h-4 w-4 text-foreground-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium hover:underline">
                      {s.assignment.title}
                    </p>
                    <p className="text-[11px] text-foreground-subtle">
                      Submitted {timeAgo(s.submittedAt)} ·{" "}
                      <span
                        className={
                          s.status === "GRADED"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }
                      >
                        {s.status}
                      </span>
                      {s.score != null && ` · Score ${s.score}/100`}
                      {s.grade && ` · ${s.grade}`}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Flagged AI */}
      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
          <ShieldAlert className="h-4 w-4 text-warning" />
          Flagged AI interactions
        </h2>
        {flagged.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            No flagged interactions. 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {flagged.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                  <span className="rounded border border-card-border bg-surface px-1.5 py-0.5 font-semibold">
                    {f.toolUsed}
                  </span>
                  {f.assignment && (
                    <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-sky-600">
                      {f.assignment.title}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(f.timestamp)}
                  </span>
                  {f.flagReasons.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-700"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {r.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
                <p className="line-clamp-3 text-foreground/80">
                  {f.promptText}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "sky" | "violet" | "amber" | "emerald";
}) {
  const tones: Record<typeof tone, string> = {
    sky: "bg-sky-500/10 text-sky-500",
    violet: "bg-fuchsia-500/10 text-fuchsia-500",
    amber: "bg-amber-500/10 text-amber-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
  };
  return (
    <div className="card p-4">
      <div
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        {icon}
      </div>
      <p className="stat-number text-2xl">{value}</p>
      <p className="text-xs text-foreground-subtle">{label}</p>
    </div>
  );
}
