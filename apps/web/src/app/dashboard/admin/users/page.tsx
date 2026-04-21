"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  ChevronLeft,
  Search,
  Shield,
  GraduationCap,
  User as UserIcon,
} from "lucide-react";
import {
  useAdminUsers,
  useUpdateUserRole,
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
          <div>
            <h1 className="font-display text-2xl font-bold">User management</h1>
            <p className="text-sm text-foreground-muted">
              Everyone in your school. Change roles, search, filter.
            </p>
          </div>
        </div>
      </div>

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
