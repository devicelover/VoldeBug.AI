"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  ChevronLeft,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useTeacherStudents } from "@web/hooks/use-teacher";

export default function TeacherStudentsPage() {
  const { data, isLoading } = useTeacherStudents();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const all = data?.students ?? [];
    if (!q) return all;
    const needle = q.toLowerCase();
    return all.filter(
      (s) =>
        (s.name ?? "").toLowerCase().includes(needle) ||
        (s.email ?? "").toLowerCase().includes(needle) ||
        s.classes.some((c) => c.toLowerCase().includes(needle)),
    );
  }, [data, q]);

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard/teacher"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to teacher dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-info/10 p-2 text-info">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">My students</h1>
            <p className="text-sm text-foreground-muted">
              Everyone in your classes. Click a student to see their full
              profile, submissions, and AI activity.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card p-3"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, or class…"
            className="input-base w-full pl-8"
          />
        </div>
      </motion.section>

      {/* List */}
      <section className="card overflow-hidden">
        {isLoading ? (
          <div className="h-40 animate-pulse" />
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-foreground-muted">
            {data?.students.length === 0
              ? "You don't have any students yet."
              : "No students match your search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-foreground-subtle">
                <tr className="border-b border-card-border">
                  <th className="p-3 text-left">Student</th>
                  <th className="hidden p-3 text-left md:table-cell">
                    Classes
                  </th>
                  <th className="p-3 text-right">Submissions</th>
                  <th className="p-3 text-right">Flagged AI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-card-border/70 hover:bg-surface/20"
                  >
                    <td className="p-3">
                      <Link
                        href={`/dashboard/teacher/students/${s.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent-light">
                          {s.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium hover:underline">
                            {s.name ?? "—"}
                          </p>
                          <p className="text-[11px] text-foreground-subtle">
                            {s.email}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden p-3 text-xs text-foreground-muted md:table-cell">
                      {s.classes.join(", ")}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <FileText className="h-3 w-3 text-foreground-subtle" />
                        {s.submissions}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {s.flagged > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          {s.flagged}
                        </span>
                      ) : (
                        <span className="text-xs text-foreground-subtle">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
