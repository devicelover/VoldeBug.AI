"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Users, ChevronLeft } from "lucide-react";
import { useTeacherClasses } from "@web/hooks/use-teacher";
import { useClassIntegrityFeed } from "@web/hooks/use-teacher";
import { IntegrityFeedList } from "@web/components/integrity/integrity-feed";

export default function TeacherIntegrityPage() {
  const classesQ = useTeacherClasses();
  const classes = classesQ.data ?? [];
  const [classId, setClassId] = useState<string>("");

  // Default the selector to the first class so the feed loads immediately
  // without the teacher having to click.
  const activeClassId = classId || classes[0]?.id;

  const feed = useClassIntegrityFeed(activeClassId, 1, 50);

  const activeClass = useMemo(
    () => classes.find((c) => c.id === activeClassId),
    [classes, activeClassId],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      {/* Header */}
      <header className="space-y-1">
        <Link
          href="/dashboard/teacher"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to teacher dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-warning/10 p-2 text-warning">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">
              AI Integrity — Class Feed
            </h1>
            <p className="text-sm text-foreground-muted">
              Flagged AI interactions from every student in your class. Click
              any row to see the full prompt and AI response.
            </p>
          </div>
        </div>
      </header>

      {/* Class selector */}
      {classes.length > 1 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card flex items-center gap-3 p-3"
        >
          <Users className="h-4 w-4 text-foreground-subtle" />
          <span className="text-xs text-foreground-muted">Class</span>
          <select
            className="input-base text-sm"
            value={activeClassId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </motion.section>
      )}

      {!activeClassId && !classesQ.isLoading && (
        <div className="card p-10 text-center text-sm text-foreground-muted">
          You don&rsquo;t own any classes yet.
        </div>
      )}

      {/* Stats strip */}
      {feed.data && activeClass && (
        <section className="card flex flex-wrap items-center gap-4 p-4 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-foreground-subtle">
              Class
            </p>
            <p className="font-semibold">{activeClass.name}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-foreground-subtle">
              Flagged interactions (all-time)
            </p>
            <p className="font-display text-2xl font-bold text-warning">
              {feed.data.total}
            </p>
          </div>
        </section>
      )}

      {/* Feed */}
      <section className="space-y-2">
        {feed.isLoading && (
          <div className="card h-40 animate-pulse" />
        )}
        {feed.isError && (
          <p className="text-sm text-rose-600">Couldn&rsquo;t load feed.</p>
        )}
        {feed.data && <IntegrityFeedList entries={feed.data.logs} showStudent />}
      </section>
    </div>
  );
}
