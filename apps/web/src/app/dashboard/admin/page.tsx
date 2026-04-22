"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GradientMesh } from "@web/components/ui/background";
import { useAdminDashboard, useSchoolIntegrityFeed } from "@web/hooks/use-admin";
import {
  Shield,
  Users,
  GraduationCap,
  School,
  TrendingUp,
  ClipboardList,
  FileText,
  AlertTriangle,
  BookOpen,
  Settings as SettingsIcon,
  ArrowRight,
  BarChart3,
  Upload,
  Wrench,
  Receipt,
  Activity,
} from "lucide-react";

// ─── Page ───────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const overview = useAdminDashboard();
  // Preview of flagged activity — we pull the top 5 and link to full
  // feed. Keeps this landing page a cockpit, not a dead end.
  const recentFlagged = useSchoolIntegrityFeed({ limit: 5 });
  const school = overview.data?.school;

  return (
    <div className="relative min-h-screen">
      <GradientMesh />
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-4 md:px-6 lg:px-8 lg:pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-accent-light" />
            <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-foreground-muted">
            {school
              ? `Managing ${school.name}. Control users, classes, tools, and school settings from here.`
              : "Control users, classes, tools, and school settings from here."}
          </p>
        </motion.div>

        {/* Real stats from the API */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            value={overview.data?.totalStudents ?? "—"}
            label="Students"
            iconBg="bg-accent/10"
            iconColor="text-accent-light"
          />
          <StatCard
            icon={<GraduationCap className="h-5 w-5" />}
            value={overview.data?.totalTeachers ?? "—"}
            label="Teachers"
            iconBg="bg-info/10"
            iconColor="text-info"
          />
          <StatCard
            icon={<School className="h-5 w-5" />}
            value={overview.data?.totalClasses ?? "—"}
            label="Classes"
            iconBg="bg-success/10"
            iconColor="text-success"
          />
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            value={overview.data?.totalAssignments ?? "—"}
            label="Assignments"
            iconBg="bg-warning/10"
            iconColor="text-warning"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<ClipboardList className="h-5 w-5" />}
            value={overview.data?.totalSubmissions ?? "—"}
            label="Submissions (all time)"
            iconBg="bg-accent/10"
            iconColor="text-accent-light"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            value={overview.data?.recentSubmissions ?? "—"}
            label="Last 7 days"
            iconBg="bg-info/10"
            iconColor="text-info"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            value={overview.data?.auditLogs.flagged ?? "—"}
            label="Flagged AI interactions"
            iconBg="bg-warning/10"
            iconColor="text-warning"
          />
        </div>

        {/* Management grid */}
        <section className="card p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">School management</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <AdminLink
              href="/dashboard/admin/users"
              icon={<Users className="h-4 w-4" />}
              label="Users"
              description="View staff and students, change roles"
            />
            <AdminLink
              href="/dashboard/admin/classes"
              icon={<School className="h-4 w-4" />}
              label="Classes"
              description="Manage sections, assign teachers"
            />
            <AdminLink
              href="/dashboard/admin/school"
              icon={<SettingsIcon className="h-4 w-4" />}
              label="School settings"
              description="Name, branding, boards, logo"
            />
            <AdminLink
              href="/dashboard/principal/integrity"
              icon={<Shield className="h-4 w-4" />}
              label="AI integrity feed"
              description="Every flagged interaction, school-wide"
              warn={(overview.data?.auditLogs.flagged ?? 0) > 0}
            />
            <AdminLink
              href="/dashboard/principal/audit-logs"
              icon={<FileText className="h-4 w-4" />}
              label="Audit logs"
              description="Raw AI prompt/response log"
            />
            <AdminLink
              href="/dashboard/lesson-plans"
              icon={<BookOpen className="h-4 w-4" />}
              label="Lesson plan library"
              description="Voldebug faculty & teacher plans"
            />
            <AdminLink
              href="/dashboard/admin/roster-import"
              icon={<Upload className="h-4 w-4" />}
              label="Bulk roster import"
              description="Add students/teachers from CSV"
            />
            <AdminLink
              href="/dashboard/admin/tools"
              icon={<Wrench className="h-4 w-4" />}
              label="AI tool catalog"
              description="Curate tools teachers can assign"
            />
            <AdminLink
              href="/dashboard/admin/billing"
              icon={<Receipt className="h-4 w-4" />}
              label="Plan & billing"
              description="Pricing tiers and seat usage"
            />
            <AdminLink
              href="/dashboard/principal/reports"
              icon={<BarChart3 className="h-4 w-4" />}
              label="Outcome reports"
              description="Per-class averages & tool adoption"
            />
            <AdminLink
              href="/dashboard/principal/teachers"
              icon={<GraduationCap className="h-4 w-4" />}
              label="Teacher performance"
              description="Activity and grading patterns"
            />
            <AdminLink
              href="/dashboard/principal/heatmap"
              icon={<Activity className="h-4 w-4" />}
              label="AI usage heatmap"
              description="Last 60 days, school-wide"
            />
          </div>
        </section>

        {/* Recent flagged preview */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Recent flagged AI activity
            </h2>
            <Link
              href="/dashboard/principal/integrity"
              className="inline-flex items-center gap-1 text-xs text-accent-light hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentFlagged.isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-surface/40" />
          ) : recentFlagged.data && recentFlagged.data.logs.length > 0 ? (
            <ul className="divide-y divide-card-border">
              {recentFlagged.data.logs.slice(0, 5).map((log) => (
                <li key={log.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-warning/10 text-[11px] font-bold text-warning">
                    {log.student.name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      <span className="font-medium">{log.student.name}</span>{" "}
                      <span className="text-foreground-muted">
                        · {log.toolUsed} ·{" "}
                        {log.flagDescriptions[0] ??
                          log.flagReasons[0]?.replace(/_/g, " ")}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-foreground-subtle">
                      {log.promptText}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-[11px] text-foreground-subtle">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground-muted">
              No flagged activity yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="card p-4">
      <div
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
      >
        {icon}
      </div>
      <p className="stat-number text-2xl leading-none">{value}</p>
      <p className="mt-1.5 text-xs text-foreground-subtle">{label}</p>
    </div>
  );
}

function AdminLink({
  href,
  label,
  description,
  icon,
  warn,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border bg-surface/20 p-4 transition-all hover:border-card-border-hover hover:bg-surface/40 ${
        warn ? "border-warning/40" : "border-card-border"
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2 text-foreground-muted">
        {icon}
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <p className="text-xs text-foreground-subtle">{description}</p>
    </Link>
  );
}
