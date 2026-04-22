"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChevronLeft,
  Search,
  Shield,
  GraduationCap,
  User as UserIcon,
  UserPlus,
  Copy,
  CheckCircle2,
} from "lucide-react";
import {
  useAdminUsers,
  useUpdateUserRole,
  useInviteUser,
  type AdminUser,
} from "@web/hooks/use-admin";

const ROLES = ["STUDENT", "TEACHER", "ADMIN"] as const;

function roleBadge(role: AdminUser["role"]) {
  switch (role) {
    case "ADMIN":
      return {
        label: "Admin",
        Icon: Shield,
        className: "bg-accent/10 text-accent-light border-accent/20",
      };
    case "TEACHER":
      return {
        label: "Teacher",
        Icon: GraduationCap,
        className: "bg-info/10 text-info border-info/20",
      };
    default:
      return {
        label: "Student",
        Icon: UserIcon,
        className: "bg-surface text-foreground-muted border-card-border",
      };
  }
}

export default function AdminUsersPage() {
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUsers({ role, q, page, limit: 50 });
  const updateRole = useUpdateUserRole();
  const invite = useInviteUser();

  const [showInvite, setShowInvite] = useState(false);
  const [iName, setIName] = useState("");
  const [iEmail, setIEmail] = useState("");
  const [iRole, setIRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [iGrade, setIGrade] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onInvite() {
    try {
      const res = await invite.mutateAsync({
        name: iName.trim(),
        email: iEmail.trim(),
        role: iRole,
        gradeLevel: iGrade ? Number(iGrade) : undefined,
      });
      setTempPassword(res.tempPassword);
      setIName("");
      setIEmail("");
      setIGrade("");
    } catch {
      /* ignore */
    }
  }

  async function copyTemp() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  }

  async function changeRole(u: AdminUser, next: string) {
    if (u.role === next) return;
    const confirm =
      next === "ADMIN" && u.role !== "ADMIN"
        ? window.confirm(
            `Promote ${u.name ?? u.email} to ADMIN? They will get full school control.`,
          )
        : true;
    if (!confirm) return;
    try {
      await updateRole.mutateAsync({ userId: u.id, role: next });
    } catch {
      /* hook will surface in dev; swallow here */
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6 md:p-10">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to admin
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2 text-accent-light">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">User management</h1>
            <p className="text-sm text-foreground-muted">
              Everyone in your school. Change roles, search, filter, invite.
            </p>
          </div>
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-light"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite user
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showInvite && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card space-y-3 overflow-hidden p-5"
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
              Invite single user
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">Name</span>
                <input
                  type="text"
                  className="input-base mt-1 w-full"
                  value={iName}
                  onChange={(e) => setIName(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Email</span>
                <input
                  type="email"
                  className="input-base mt-1 w-full"
                  value={iEmail}
                  onChange={(e) => setIEmail(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Role</span>
                <select
                  className="input-base mt-1 w-full"
                  value={iRole}
                  onChange={(e) => setIRole(e.target.value as typeof iRole)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              {iRole === "STUDENT" && (
                <label className="block text-sm">
                  <span className="font-medium">Class (optional)</span>
                  <select
                    className="input-base mt-1 w-full"
                    value={iGrade}
                    onChange={(e) => setIGrade(e.target.value)}
                  >
                    <option value="">—</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>
                        Class {g}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {invite.isError && (
              <p className="text-sm text-rose-600">
                {(invite.error as Error)?.message ?? "Couldn’t invite."}
              </p>
            )}
            {tempPassword && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-800/50 dark:bg-emerald-900/20">
                <p className="mb-2 inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  User created. Share this temporary password with them:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-surface p-1.5 font-mono text-xs">
                    {tempPassword}
                  </code>
                  <button
                    onClick={copyTemp}
                    className="rounded border border-card-border bg-background px-2 py-1 text-xs hover:bg-surface"
                  >
                    <Copy className="mr-1 inline h-3 w-3" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowInvite(false);
                  setTempPassword(null);
                }}
                className="rounded-lg border border-card-border px-3 py-1.5 text-sm hover:bg-surface"
              >
                Done
              </button>
              <button
                onClick={onInvite}
                disabled={invite.isPending || !iName.trim() || !iEmail.trim()}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-50"
              >
                {invite.isPending ? "Inviting…" : "Send invite"}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Filters */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card grid gap-3 p-3 md:grid-cols-[1fr_auto]"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email"
            className="input-base w-full pl-8"
          />
        </div>
        <select
          className="input-base"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </motion.section>

      {/* Table */}
      <section className="card overflow-hidden">
        {isLoading ? (
          <div className="h-40 animate-pulse" />
        ) : !data || data.users.length === 0 ? (
          <p className="p-10 text-center text-sm text-foreground-muted">
            No users match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-foreground-subtle">
                <tr className="border-b border-card-border">
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="hidden p-3 text-left md:table-cell">Class</th>
                  <th className="hidden p-3 text-left md:table-cell">
                    Last active
                  </th>
                  <th className="p-3 text-right">Change role</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => {
                  const badge = roleBadge(u.role);
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-card-border/70 hover:bg-surface/20"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent-light">
                            {u.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-medium">{u.name ?? "—"}</p>
                            <p className="text-[11px] text-foreground-subtle">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                        >
                          <badge.Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="hidden p-3 text-xs text-foreground-muted md:table-cell">
                        {u.gradeLevel ? `Class ${u.gradeLevel}` : "—"}
                      </td>
                      <td className="hidden p-3 text-xs text-foreground-muted md:table-cell">
                        {u.lastActiveAt
                          ? new Date(u.lastActiveAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={u.role}
                          disabled={updateRole.isPending}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="input-base h-8 text-xs"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0) + r.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data && data.total > 50 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-card-border px-2 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-foreground-subtle">Page {page}</span>
          <button
            disabled={page * 50 >= data.total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-card-border px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
