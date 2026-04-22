"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ChevronLeft, Activity, AlertTriangle, Filter } from "lucide-react";
import { usePrincipalHeatmap, type HeatmapDay } from "@web/hooks/use-admin";

// Bucketize day counts into 0-4 intensity for cell shading.
function intensity(total: number, max: number): number {
  if (total === 0) return 0;
  if (max === 0) return 0;
  const r = total / max;
  if (r > 0.75) return 4;
  if (r > 0.5) return 3;
  if (r > 0.25) return 2;
  return 1;
}

const SHADES = [
  "bg-surface/40", // 0
  "bg-emerald-500/15",
  "bg-emerald-500/30",
  "bg-emerald-500/55",
  "bg-emerald-500/85",
];

export default function PrincipalHeatmapPage() {
  const { data, isLoading, isError } = usePrincipalHeatmap();
  const [windowDays, setWindowDays] = useState<30 | 60 | 90>(60);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Client-side filtering — keeps the API endpoint simple. Server returns
  // 60 days; we trim the window down on demand.
  const filteredDays = useMemo(() => {
    if (!data?.days) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    cutoff.setHours(0, 0, 0, 0);
    let out = data.days.filter((d) => new Date(d.date) >= cutoff);
    if (flaggedOnly) out = out.map((d) => ({ ...d, total: d.flagged }));
    return out;
  }, [data, windowDays, flaggedOnly]);

  const grid = useMemo(() => {
    const days = filteredDays;
    if (days.length === 0) return null;
    const maxTotal = Math.max(...days.map((d) => d.total), 1);
    // Group by ISO week. Each cell is one day; columns = weeks; rows = weekday.
    const byWeek = new Map<string, HeatmapDay[]>();
    for (const d of days) {
      const date = new Date(d.date);
      // Compute "year-week" key. Monday-anchored (ISO week).
      const tmp = new Date(date);
      tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const week = Math.ceil(
        ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      const key = `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
      if (!byWeek.has(key)) byWeek.set(key, []);
      byWeek.get(key)!.push(d);
    }
    return { weeks: Array.from(byWeek.entries()), maxTotal };
  }, [filteredDays]);

  const totals = useMemo(() => {
    if (!filteredDays.length) return { total: 0, flagged: 0 };
    return {
      total: filteredDays.reduce((s, d) => s + d.total, 0),
      flagged: filteredDays.reduce((s, d) => s + d.flagged, 0),
    };
  }, [filteredDays]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard/principal"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to principal dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-fuchsia-500/10 p-2 text-fuchsia-500">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">
              School AI usage heatmap
            </h1>
            <p className="text-sm text-foreground-muted">
              Daily AI activity across your school for the last 60 days. Hover
              a cell for the breakdown. Darker = more activity that day.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card flex flex-wrap items-center gap-3 p-3"
      >
        <Filter className="h-3.5 w-3.5 text-foreground-subtle" />
        <span className="text-xs text-foreground-muted">Window</span>
        <div className="inline-flex rounded-lg border border-card-border bg-surface/40 p-0.5">
          {([30, 60, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setWindowDays(d)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                windowDays === d
                  ? "bg-accent text-white"
                  : "text-foreground-muted"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <label className="ml-2 inline-flex cursor-pointer items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-amber-500"
          />
          Flagged only
        </label>
      </motion.section>

      {/* Top stats */}
      {data && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-3 md:grid-cols-3"
        >
          <div className="card p-4">
            <p className="stat-number text-2xl">{totals.total}</p>
            <p className="text-xs text-foreground-subtle">
              AI interactions, last 60 days
            </p>
          </div>
          <div className="card p-4">
            <p className="stat-number text-2xl text-amber-600">
              {totals.flagged}
            </p>
            <p className="text-xs text-foreground-subtle">Flagged</p>
          </div>
          <div className="card p-4">
            <p className="stat-number text-2xl">
              {totals.total > 0
                ? Math.round((totals.flagged / totals.total) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-foreground-subtle">Flag ratio</p>
          </div>
        </motion.section>
      )}

      {/* Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="card p-5"
      >
        {isLoading && <div className="h-32 animate-pulse" />}
        {isError && (
          <p className="text-sm text-rose-600">Couldn&rsquo;t load heatmap.</p>
        )}
        {grid && (
          <div className="overflow-x-auto">
            <div className="flex gap-1">
              {grid.weeks.map(([weekKey, days]) => (
                <div key={weekKey} className="flex flex-col gap-1">
                  {days.map((d) => {
                    const dayOfWeek = new Date(d.date).getDay();
                    const i = intensity(d.total, grid.maxTotal);
                    return (
                      <div
                        key={d.date}
                        title={`${d.date}: ${d.total} interactions${d.flagged ? `, ${d.flagged} flagged` : ""}`}
                        className={`h-3.5 w-3.5 rounded-sm ${SHADES[i]} ${d.flagged > 0 ? "ring-1 ring-amber-400" : ""}`}
                        style={{ marginTop: dayOfWeek === 0 && days[0] === d ? 0 : undefined }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-3 text-[11px] text-foreground-subtle">
              <span>Less</span>
              {SHADES.map((s, i) => (
                <span key={i} className={`h-3 w-3 rounded-sm ${s}`} />
              ))}
              <span>More</span>
              <span className="ml-4 inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm bg-surface ring-1 ring-amber-400" />
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                Flagged that day
              </span>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}
