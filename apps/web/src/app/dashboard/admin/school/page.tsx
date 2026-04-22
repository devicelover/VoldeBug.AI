"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  School,
  ChevronLeft,
  Save,
  CheckCircle2,
  Users,
  GraduationCap,
} from "lucide-react";
import { useAdminSchool, useUpdateSchool } from "@web/hooks/use-admin";

export default function AdminSchoolPage() {
  const school = useAdminSchool();
  const update = useUpdateSchool();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (school.data) setName(school.data.name);
  }, [school.data]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  async function onSave() {
    try {
      await update.mutateAsync({ name: name.trim() });
      setSaved(true);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6 md:p-10">
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
            <h1 className="font-display text-2xl font-bold">School settings</h1>
            <p className="text-sm text-foreground-muted">
              Settings that apply to your entire school. Branding and logo
              upload are coming next.
            </p>
          </div>
        </div>
      </div>

      {school.data && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="card p-4">
            <Users className="mb-2 h-5 w-5 text-accent-light" />
            <p className="stat-number text-2xl">
              {school.data._count.members}
            </p>
            <p className="text-xs text-foreground-subtle">Members</p>
          </div>
          <div className="card p-4">
            <GraduationCap className="mb-2 h-5 w-5 text-info" />
            <p className="stat-number text-2xl">
              {school.data._count.classes}
            </p>
            <p className="text-xs text-foreground-subtle">Classes</p>
          </div>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="card space-y-4 p-5"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
          Identity
        </h2>
        <label className="block text-sm">
          <span className="font-medium">School name</span>
          <input
            type="text"
            className="input-base mt-1 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Delhi Public School Bangalore South"
          />
        </label>

        {update.isError && (
          <p className="text-sm text-rose-600">
            {(update.error as Error)?.message ?? "Couldn’t save."}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
          <button
            onClick={onSave}
            disabled={update.isPending || !name.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xl shadow-accent/20 hover:bg-accent-light disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </motion.section>

      {/* Coming soon */}
      <section className="card space-y-2 p-5 opacity-70">
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
          Coming soon
        </h2>
        <ul className="text-sm text-foreground-muted">
          <li>• School logo upload (white-label header)</li>
          <li>• Brand color (per-school accent)</li>
          <li>• Default board / boards offered (CBSE / ICSE / IB / state)</li>
          <li>• Custom domain (e.g. ai.dpsbangalore.edu.in)</li>
          <li>• Plan tier &amp; seat limit</li>
        </ul>
      </section>
    </div>
  );
}
