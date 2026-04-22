"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  GraduationCap,
  Trophy,
  Award,
  AlertCircle,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  type Notification,
} from "@web/hooks/use-notifications";

const TYPE_ICON: Record<string, { Icon: typeof Bell; color: string }> = {
  GRADE_RECEIVED: { Icon: Trophy, color: "text-emerald-500" },
  ASSIGNMENT_CREATED: { Icon: GraduationCap, color: "text-sky-500" },
  BADGE_EARNED: { Icon: Award, color: "text-amber-500" },
  LEVEL_UP: { Icon: Award, color: "text-fuchsia-500" },
  TEACHER_MESSAGE: { Icon: MessageSquare, color: "text-indigo-500" },
  DEADLINE_REMINDER: { Icon: AlertCircle, color: "text-rose-500" },
  DEFAULT: { Icon: Bell, color: "text-foreground-muted" },
};

function timeAgo(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isLoading } = useNotifications({ unreadOnly, limit: 100 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6 md:p-10">
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
            <Bell className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-foreground-muted">
              Everything that happened to you on Voldebug.
            </p>
          </div>
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-surface disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>
      </div>

      {/* Filter chip */}
      <div className="flex gap-2">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !unreadOnly
              ? "bg-accent text-white"
              : "border border-card-border text-foreground-muted hover:bg-surface"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            unreadOnly
              ? "bg-accent text-white"
              : "border border-card-border text-foreground-muted hover:bg-surface"
          }`}
        >
          Unread only
        </button>
      </div>

      {/* List */}
      <section className="space-y-2">
        {isLoading && (
          <>
            <div className="card h-16 animate-pulse" />
            <div className="card h-16 animate-pulse" />
          </>
        )}
        {data && data.notifications.length === 0 && (
          <div className="card flex flex-col items-center gap-2 p-10 text-center">
            <Bell className="h-8 w-8 text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">
              {unreadOnly ? "Nothing unread." : "No notifications yet."}
            </p>
          </div>
        )}
        {data?.notifications.map((n: Notification) => {
          const meta = TYPE_ICON[n.type] ?? TYPE_ICON.DEFAULT;
          return (
            <motion.article
              key={n.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card flex gap-3 p-4 ${n.isRead ? "opacity-70" : "border-accent/30"}`}
            >
              <div className={`mt-0.5 ${meta.color}`}>
                <meta.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {!n.isRead && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                </div>
                <p className="mt-1 text-sm text-foreground-muted">{n.body}</p>
                <p className="mt-1 text-[11px] text-foreground-subtle">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markRead.mutate(n.id)}
                  className="text-[11px] text-accent-light hover:underline"
                  title="Mark as read"
                >
                  Mark read
                </button>
              )}
            </motion.article>
          );
        })}
      </section>
    </div>
  );
}
