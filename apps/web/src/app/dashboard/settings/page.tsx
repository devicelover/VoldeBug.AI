"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  ChevronLeft,
  User as UserIcon,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useMe, useUpdateMe } from "@web/hooks/use-me";

export default function SettingsPage() {
  const me = useMe();
  const update = useUpdateMe();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [studentId, setStudentId] = useState("");
  const [dob, setDob] = useState("");
  const [saved, setSaved] = useState(false);

  // Hydrate from server
  useEffect(() => {
    if (!me.data) return;
    setName(me.data.name ?? "");
    setImage(me.data.image ?? "");
    setGradeLevel(me.data.gradeLevel ? String(me.data.gradeLevel) : "");
    setStudentId(me.data.studentId ?? "");
    setDob(me.data.dateOfBirth ? me.data.dateOfBirth.slice(0, 10) : "");
  }, [me.data]);

  // Auto-clear saved indicator
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  async function onSave() {
    try {
      await update.mutateAsync({
        name: name.trim() || undefined,
        image: image.trim() || undefined,
        gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
        studentId: studentId.trim() || undefined,
        dateOfBirth: dob ? new Date(dob).toISOString() : undefined,
      });
      setSaved(true);
    } catch {
      /* react-query exposes error on `update.error` */
    }
  }

  if (me.isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="card h-72 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2 text-accent-light">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Settings</h1>
            <p className="text-sm text-foreground-muted">
              Update the things about you that you control. Role, school, and
              grade-promotion are managed by your school admin.
            </p>
          </div>
        </div>
      </div>

      {/* Identity (read-only) */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card space-y-3 p-5"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
          Account
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-foreground-subtle" />
          <span>{me.data?.email}</span>
          <span className="ml-auto rounded-md border border-card-border bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-foreground-muted">
            {me.data?.role}
          </span>
        </div>
      </motion.section>

      {/* Profile editable */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="card space-y-4 p-5"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
          Profile
        </h2>

        <label className="block text-sm">
          <span className="font-medium">Display name</span>
          <input
            type="text"
            className="input-base mt-1 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How you appear to teachers and classmates"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Profile picture URL</span>
          <input
            type="url"
            className="input-base mt-1 w-full"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://… (optional)"
          />
        </label>

        {me.data?.role === "STUDENT" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium">Class</span>
                <select
                  className="input-base mt-1 w-full"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                >
                  <option value="">—</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g}>
                      Class {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Student ID</span>
                <input
                  type="text"
                  className="input-base mt-1 w-full"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Your school's student number"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium">Date of birth</span>
              <input
                type="date"
                className="input-base mt-1 w-full"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-foreground-subtle">
                Used to determine if parental consent is needed under the
                DPDP Act 2023.
              </p>
            </label>
          </>
        )}

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
            disabled={update.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xl shadow-accent/20 hover:bg-accent-light disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </motion.section>

      {/* Privacy & data */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card space-y-3 p-5"
      >
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground-subtle">
          <ShieldCheck className="h-3 w-3" />
          Privacy &amp; data
        </h2>
        <p className="text-sm text-foreground-muted">
          Your AI activity is logged for academic-integrity transparency. View
          everything we&rsquo;ve recorded about you at{" "}
          <Link
            href="/dashboard/ai-log"
            className="text-accent-light hover:underline"
          >
            AI Activity Log
          </Link>
          .
        </p>
        {me.data?.consentStatus &&
          me.data.consentStatus !== "NOT_REQUIRED" && (
            <p className="text-sm text-foreground-muted">
              Parental consent status:{" "}
              <Link
                href="/dashboard/parental-consent"
                className="font-semibold text-accent-light hover:underline"
              >
                {me.data.consentStatus}
              </Link>
            </p>
          )}
      </motion.section>
    </div>
  );
}
