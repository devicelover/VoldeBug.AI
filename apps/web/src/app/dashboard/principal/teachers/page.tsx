"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  ChevronLeft,
  School,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { usePrincipalTeachers } from "@web/hooks/use-admin";

function timeAgo(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const d = Math.round(diff / (1000 * 60 * 60 * 24));
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

export default function PrincipalTeachersPage() {
  const { data, isLoading, isError } = usePrincipalTeachers();

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard/principal"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to principal dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">
              Teacher performance
            </h1>
            <p className="text-sm text-foreground-muted">
              Activity and grading patterns for every teacher in your school.
            </p>
          </div>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card overflow-hidden"
      >
        {isLoading ? (
          <div className="h-40 animate-pulse" />
        ) : isError ? (
          <p className="p-10 text-center text-sm text-rose-600">
            Couldn&rsquo;t load teachers.
          </p>
        ) : !data || data.teachers.length === 0 ? (
          <p className="p-10 text-center text-sm text-foreground-muted">
            No teachers in your school yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-foreground-subtle">
                <tr className="border-b border-card-border">
                  <th className="p-3 text-left">Teacher</th>
                  <th className="p-3 text-right">Classes</th>
                  <th className="p-3 text-right">Assignments</th>
                  <th className="p-3 text-right">Graded</th>
                  <th className="p-3 text-right">Avg score given</th>
                  <th className="p-3 text-right">Last active</th>
                </tr>
              </thead>
              <tbody>
                {data.teachers.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-card-border/70 hover:bg-surface/20"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600">
                          {t.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium">{t.name ?? "—"}</p>
                          <p className="text-[11px] text-foreground-subtle">
                            {t.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <School className="h-3 w-3 text-foreground-subtle" />
                        {t.classesCount}
                      </span>
                    </td>
                    <td className="p-3 text-right">{t.assignmentsCount}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {t.gradedCount}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {t.averageScoreGiven != null
                        ? `${t.averageScoreGiven}%`
                        : "—"}
                    </td>
                    <td className="p-3 text-right text-xs text-foreground-subtle">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(t.lastActiveAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </div>
  );
}
