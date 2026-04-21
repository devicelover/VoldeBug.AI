"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  School,
  ChevronLeft,
  GraduationCap,
  Users,
  FileText,
  Trash2,
} from "lucide-react";
import {
  useAdminClasses,
  useDeleteClass,
  type AdminClass,
} from "@web/hooks/use-admin";

export default function AdminClassesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminClasses({ page, limit: 50 });
  const deleteClass = useDeleteClass();

  async function removeClass(c: AdminClass) {
    const confirmed = window.confirm(
      `Delete class "${c.name}"? Submissions and assignments are kept for audit; membership is removed.`,
    );
    if (!confirmed) return;
    try {
      await deleteClass.mutateAsync(c.id);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to admin
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-info/10 p-2 text-info">
            <School className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Class management</h1>
            <p className="text-sm text-foreground-muted">
              All classes in your school. Assigning a teacher or renaming is
              done in the teacher&rsquo;s own dashboard — this page is for
              roll-up and cleanup.
            </p>
          </div>
        </div>
      </div>

      <section className="card overflow-hidden">
        {isLoading ? (
          <div className="h-40 animate-pulse" />
        ) : !data || data.classes.length === 0 ? (
          <p className="p-10 text-center text-sm text-foreground-muted">
            No classes yet.
          </p>
        ) : (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="divide-y divide-card-border"
          >
            {data.classes.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {c.teacher?.name ?? "No teacher assigned"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {c._count?.members ?? 0} students
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {c._count?.assignments ?? 0} assignments
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => removeClass(c)}
                    disabled={deleteClass.isPending}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </section>
    </div>
  );
}
