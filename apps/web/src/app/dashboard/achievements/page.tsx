"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Award,
  Flame,
  Zap,
  TrendingUp,
  ChevronLeft,
  Star,
  Sparkles,
} from "lucide-react";
import { useDashboardStats } from "@web/hooks/use-dashboard";

interface BadgeRecord {
  id?: string;
  name?: string;
  description?: string;
  iconUrl?: string;
  earnedAt?: string;
  progressCount?: number;
  // Voldebug seeds badges with these emoji icons; if they're URLs we
  // fall back to the icon URL.
  badge?: { name: string; description: string; iconUrl: string };
}

function timeAgo(s?: string): string {
  if (!s) return "";
  const diff = Date.now() - new Date(s).getTime();
  const d = Math.round(diff / (1000 * 60 * 60 * 24));
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

export default function AchievementsPage() {
  const stats = useDashboardStats();

  const xp = stats.data?.xp;
  const streak = stats.data?.streak;
  const badges = stats.data?.badges;
  const items: BadgeRecord[] = (badges?.items as BadgeRecord[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-500">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Achievements</h1>
            <p className="text-sm text-foreground-muted">
              Badges, streaks, and XP — all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Hero stats */}
      {stats.isLoading ? (
        <div className="card h-32 animate-pulse" />
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 md:grid-cols-4"
        >
          <StatCard
            label="Level"
            value={xp?.level ?? 0}
            icon={<Star className="h-5 w-5" />}
            tone="violet"
            secondary={`${xp?.total ?? 0} XP total`}
          />
          <StatCard
            label="This week"
            value={`+${xp?.thisWeek ?? 0}`}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="emerald"
            secondary={`${xp?.toNextLevel ?? 0} XP to level up`}
          />
          <StatCard
            label="Streak"
            value={streak?.current ?? 0}
            icon={<Flame className="h-5 w-5" />}
            tone="amber"
            secondary={`Best: ${streak?.longest ?? 0} days`}
          />
          <StatCard
            label="Badges"
            value={`${badges?.earned ?? 0}/${badges?.total ?? 0}`}
            icon={<Award className="h-5 w-5" />}
            tone="sky"
            secondary={
              (badges?.total ?? 0) > 0
                ? `${Math.round(((badges?.earned ?? 0) / (badges?.total || 1)) * 100)}% complete`
                : "—"
            }
          />
        </motion.section>
      )}

      {/* Badges grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="space-y-3"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles className="h-4 w-4 text-accent-light" />
          Your badges
        </h2>
        {items.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-10 text-center">
            <Award className="h-8 w-8 text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">
              No badges earned yet. Submit assignments, log AI use
              transparently, and complete daily challenges to start
              earning.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {items.map((b, i) => {
              const name = b.name ?? b.badge?.name ?? "Badge";
              const desc = b.description ?? b.badge?.description ?? "";
              const icon = b.iconUrl ?? b.badge?.iconUrl ?? "🏆";
              const earned = !!b.earnedAt;
              return (
                <motion.div
                  key={b.id ?? i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`card p-4 text-center ${earned ? "" : "opacity-60"}`}
                >
                  <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-3xl">
                    {icon}
                  </div>
                  <p className="font-display text-sm font-semibold">{name}</p>
                  <p className="mt-1 text-xs text-foreground-muted">{desc}</p>
                  {earned && (
                    <p className="mt-2 text-[11px] text-emerald-600">
                      Earned {timeAgo(b.earnedAt)}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* XP help */}
      <section className="card flex items-start gap-3 p-4">
        <Zap className="mt-0.5 h-4 w-4 text-amber-500" />
        <div className="text-xs text-foreground-muted">
          <p className="font-medium text-foreground">How XP works</p>
          <p className="mt-1">
            You earn XP for submitting assignments, getting graded, using
            AI tools transparently, and keeping daily streaks. Level is
            calculated server-side from your total XP — your school can
            verify every point on your audit log.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  secondary,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: "violet" | "emerald" | "amber" | "sky";
  secondary?: string;
}) {
  const tones: Record<typeof tone, string> = {
    violet: "bg-fuchsia-500/10 text-fuchsia-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    sky: "bg-sky-500/10 text-sky-500",
  };
  return (
    <div className="card p-4">
      <div
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        {icon}
      </div>
      <p className="stat-number text-2xl leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium text-foreground-subtle">{label}</p>
      {secondary && (
        <p className="mt-1 text-[11px] text-foreground-subtle">{secondary}</p>
      )}
    </div>
  );
}
