"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Building, ChevronLeft, AlertTriangle } from "lucide-react";
import { useSchoolIntegrityFeed } from "@web/hooks/use-admin";
import { IntegrityFeedList } from "@web/components/integrity/integrity-feed";

export default function PrincipalIntegrityPage() {
  const [studentId, setStudentId] = useState<string>("");
  const [page, setPage] = useState(1);

  const feed = useSchoolIntegrityFeed({
    studentId: studentId || undefined,
    page,
    limit: 50,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <header className="space-y-1">
        <Link
          href="/dashboard/principal"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to principal dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-warning/10 p-2 text-warning">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">
              School-wide AI Integrity
            </h1>
            <p className="text-sm text-foreground-muted">
              Every flagged AI interaction across your school, with full
              prompt + response visibility. Use this to spot patterns,
              coach teachers, and address academic-integrity concerns with
              evidence.
            </p>
          </div>
        </div>
      </header>

      {/* Filter strip */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card flex flex-wrap items-center gap-3 p-4"
      >
        <Building className="h-4 w-4 text-foreground-subtle" />
        <label className="text-xs text-foreground-muted">
          Filter by student ID (optional)
        </label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value);
            setPage(1);
          }}
          placeholder="paste a student's user ID"
          className="input-base max-w-xs text-sm"
        />
        {studentId && (
          <button
            onClick={() => setStudentId("")}
            className="text-xs text-accent-light hover:underline"
          >
            Clear
          </button>
        )}
      </motion.section>

      {/* Summary */}
      {feed.data && (
        <section className="card flex flex-wrap items-center gap-6 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-foreground-subtle">
              Flagged interactions
            </p>
            <p className="font-display text-3xl font-bold text-warning">
              {feed.data.total}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Each row is one interaction where our detection rules
            identified something worth reviewing.
          </div>
        </section>
      )}

      {/* Feed */}
      <section className="space-y-2">
        {feed.isLoading && <div className="card h-40 animate-pulse" />}
        {feed.isError && (
          <p className="text-sm text-rose-600">Couldn&rsquo;t load feed.</p>
        )}
        {feed.data && <IntegrityFeedList entries={feed.data.logs} showStudent />}
      </section>
    </div>
  );
}
