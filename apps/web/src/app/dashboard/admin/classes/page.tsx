"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  School,
  ChevronLeft,
  GraduationCap,
  Users,
  FileText,
  Trash2,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  useAdminClasses,
  useDeleteClass,
  useCreateClass,
  type AdminClass,
} from "@web/hooks/use-admin";

export default function AdminClassesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminClasses({ page, limit: 50 });
  const deleteClass = useDeleteClass();
  const createClass = useCreateClass();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  async function onCreate() {
    try {
      const created = await createClass.mutateAsync({
        name: newName.trim(),
        teacherEmail: teacherEmail.trim() || undefined,
      });
      setNewName("");
      setTeacherEmail("");
      setShowForm(false);
      setCreatedBanner(`Class "${created.name}" created.`);
      setTimeout(() => setCreatedBanner(null), 3500);
    } catch {
      /* surfaced via createClass.error */
    }
  }

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
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">Class management</h1>
            <p className="text-sm text-foreground-muted">
              Create classes, assign teachers, remove old ones.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-light"
          >
            <Plus className="h-3.5 w-3.5" />
            New class
          </button>
        </div>
      </div>

      {createdBanner && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center gap-2 border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4" />
          {createdBanner}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card space-y-3 overflow-hidden p-5"
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
              Create class
            </h2>
            <label className="block text-sm">
              <span className="font-medium">Class name</span>
              <input
                type="text"
                className="input-base mt-1 w-full"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Class 9-A Science"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Teacher email (optional)</span>
              <input
                type="email"
                className="input-base mt-1 w-full"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="leave blank to assign yourself"
              />
              <p className="mt-1 text-[11px] text-foreground-subtle">
                The teacher must already exist as a TEACHER or ADMIN in your
                school. Use Bulk roster import or Invite user first if not.
              </p>
            </label>
            {createClass.isError && (
              <p className="text-sm text-rose-600">
                {(createClass.error as Error)?.message ?? "Couldn’t create."}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-card-border px-3 py-1.5 text-sm hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={onCreate}
                disabled={createClass.isPending || !newName.trim()}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-50"
              >
                {createClass.isPending ? "Creating…" : "Create class"}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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
