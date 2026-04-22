"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  BarChart3,
  TrendingUp,
  Bot,
  ShieldAlert,
  School,
  Printer,
} from "lucide-react";
import { usePrincipalReports } from "@web/hooks/use-admin";

export default function PrincipalReportsPage() {
  const { data, isLoading, isError } = usePrincipalReports();

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6 md:p-10 print:p-2">
      <div className="print:hidden">
        <Link
          href="/dashboard/principal"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to principal dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-sky-500/10 p-2 text-sky-500">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">
              School outcome reports
            </h1>
            <p className="text-sm text-foreground-muted">
              Per-class averages, AI tool adoption, and integrity health.
              Print-ready for parent meetings or board reviews.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-surface"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {isLoading && <div className="card h-40 animate-pulse" />}
      {isError && (
        <p className="text-sm text-rose-600">Couldn&rsquo;t load report.</p>
      )}

      {data && (
        <>
          {/* Top stats */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-3 md:grid-cols-3"
          >
            <Stat
              icon={<Bot className="h-5 w-5" />}
              label="AI interactions logged"
              value={data.integrity.total}
              tone="violet"
            />
            <Stat
              icon={<ShieldAlert className="h-5 w-5" />}
              label="Flagged interactions"
              value={data.integrity.flagged}
              secondary={`${data.integrity.flaggedRatio}% of total`}
              tone={data.integrity.flagged > 0 ? "amber" : "emerald"}
            />
            <Stat
              icon={<School className="h-5 w-5" />}
              label="Classes reporting"
              value={data.perClass.length}
              tone="sky"
            />
          </motion.section>

          {/* Per-class table */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="card overflow-hidden"
          >
            <h2 className="border-b border-card-border p-4 font-display text-base font-semibold">
              Per-class outcomes
            </h2>
            {data.perClass.length === 0 ? (
              <p className="p-10 text-center text-sm text-foreground-muted">
                No classes yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-foreground-subtle">
                    <tr className="border-b border-card-border">
                      <th className="p-3 text-left">Class</th>
                      <th className="p-3 text-left">Teacher</th>
                      <th className="p-3 text-right">Students</th>
                      <th className="p-3 text-right">Assignments</th>
                      <th className="p-3 text-right">Submissions</th>
                      <th className="p-3 text-right">Avg score</th>
                      <th className="p-3 text-right">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perClass.map((c) => (
                      <tr
                        key={c.classId}
                        className="border-b border-card-border/70"
                      >
                        <td className="p-3 font-medium">{c.className}</td>
                        <td className="p-3 text-foreground-muted">
                          {c.teacherName}
                        </td>
                        <td className="p-3 text-right">{c.members}</td>
                        <td className="p-3 text-right">{c.assignments}</td>
                        <td className="p-3 text-right">{c.submissions}</td>
                        <td className="p-3 text-right font-semibold">
                          {c.averageScore != null ? `${c.averageScore}%` : "—"}
                        </td>
                        <td className="p-3 text-right">
                          {c.completionRate != null
                            ? `${c.completionRate}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.section>

          {/* Tool usage */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="card p-5"
          >
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              AI tools — adoption ranking
            </h2>
            {data.toolUsage.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                No AI activity logged yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.toolUsage.map((t, i) => {
                  const max = Math.max(...data.toolUsage.map((x) => x.count));
                  const pct = Math.round((t.count / max) * 100);
                  return (
                    <li key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{t.tool}</span>
                        <span className="text-foreground-subtle">
                          {t.count}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded bg-surface">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.section>
        </>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  secondary,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  secondary?: string;
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
      {secondary && (
        <p className="mt-0.5 text-[11px] text-foreground-subtle">{secondary}</p>
      )}
    </div>
  );
}
