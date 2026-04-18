"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditLogs, type AuditLogEntry } from "@web/hooks/use-admin";
import { GradientMesh } from "@web/components/ui/background";
import {
  Shield,
  ShieldAlert,
  AlertOctagon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Bot,
  User,
  Search,
  Filter,
  Eye,
  EyeOff,
  FileText,
  ArrowLeft,
  MessageSquare,
  Cpu,
  X,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────

const PAGE_SIZE = 15;
const NAVY = "#0D1B2A";
const NAVY_BORDER = "#1B2B40";

type FilterMode = "all" | "flagged" | "safe";

// ─── Motion Config ──────────────────────────────────────────────────────

const smoothEase = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: smoothEase },
  },
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.4, ease: smoothEase },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: smoothEase },
  },
};

// ─── Sub-components ─────────────────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl transition-all duration-500 hover:border-white/10 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] ${className}`}>
      {children}
    </div>
  );
}

function StatusBadge({ flagged }: { flagged: boolean }) {
  if (flagged) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/20 shadow-[0_0_12px_-4px_rgba(239,68,68,0.3)]">
        <AlertOctagon className="w-3 h-3" />
        Flagged
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <Shield className="w-3 h-3" />
      Safe
    </span>
  );
}

function ToolBadge({ tool }: { tool: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/15">
      <Cpu className="w-3 h-3" />
      {tool}
    </span>
  );
}

function FilterButton({
  label,
  icon,
  active,
  onClick,
  count,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${
        active
          ? "bg-white/10 border-white/15 text-white shadow-lg"
          : "bg-white/[0.02] border-white/5 text-foreground-subtle hover:bg-white/5 hover:border-white/10"
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
          active ? "bg-white/15" : "bg-white/5"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Skeleton Loaders ───────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div className="p-4 border-b border-white/[0.03] animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-white/5" />
        <div className="flex-1 grid grid-cols-5 gap-4 items-center">
          <div className="h-3 w-24 bg-white/5 rounded" />
          <div className="h-3 w-20 bg-white/5 rounded" />
          <div className="h-3 w-16 bg-white/5 rounded" />
          <div className="h-3 w-full bg-white/5 rounded" />
          <div className="h-5 w-16 bg-white/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Expandable Log Row ─────────────────────────────────────────────────

function AuditLogRow({ log }: { log: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = useMemo(() => {
    const d = new Date(log.timestamp);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [log.timestamp]);

  const formattedTime = useMemo(() => {
    const d = new Date(log.timestamp);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [log.timestamp]);

  const truncatedPrompt = useMemo(() => {
    if (log.promptText.length <= 80) return log.promptText;
    return log.promptText.slice(0, 80).trim() + "…";
  }, [log.promptText]);

  return (
    <div
      className={`border-b border-white/[0.03] transition-colors duration-300 ${
        log.isFlagged
          ? "hover:bg-red-500/[0.03]"
          : "hover:bg-white/[0.02]"
      } ${expanded ? (log.isFlagged ? "bg-red-500/[0.02]" : "bg-white/[0.015]") : ""}`}
    >
      {/* ── Clickable Row ───────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 md:px-6 flex items-center gap-3 md:gap-4 cursor-pointer group"
      >
        {/* Expand icon */}
        <div className="flex-shrink-0">
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: smoothEase }}
          >
            <ChevronDown className="w-4 h-4 text-foreground-subtle group-hover:text-white/60 transition-colors" />
          </motion.div>
        </div>

        {/* Student avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border ${
          log.isFlagged
            ? "bg-red-500/10 border-red-500/20"
            : `bg-[${NAVY}] border-[${NAVY_BORDER}]`
        }`}>
          <User className={`w-4 h-4 ${log.isFlagged ? "text-red-400" : "text-sky-400"}`} />
        </div>

        {/* Data columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[140px_1fr_100px_1fr_90px] gap-1 md:gap-4 items-center min-w-0">
          {/* Date/Time */}
          <div className="hidden md:block">
            <p className="text-xs font-medium">{formattedDate}</p>
            <p className="text-[10px] text-foreground-subtle">{formattedTime}</p>
          </div>

          {/* Student Name */}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{log.student?.name ?? "Unknown"}</p>
            <p className="text-[10px] text-foreground-subtle truncate md:hidden">{formattedDate} · {formattedTime}</p>
          </div>

          {/* Tool */}
          <div className="hidden md:block">
            <ToolBadge tool={log.toolUsed} />
          </div>

          {/* Prompt snippet */}
          <p className="text-xs text-foreground-subtle truncate hidden md:block">{truncatedPrompt}</p>

          {/* Status */}
          <div className="hidden md:flex justify-end">
            <StatusBadge flagged={log.isFlagged} />
          </div>

          {/* Mobile: tool + status inline */}
          <div className="flex items-center gap-2 md:hidden">
            <ToolBadge tool={log.toolUsed} />
            <StatusBadge flagged={log.isFlagged} />
          </div>
        </div>
      </button>

      {/* ── Expanded Detail ──────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 md:px-6 pb-5 pt-1 pl-[52px] md:pl-[72px] space-y-4">
              {/* Prompt block */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">
                    Student Prompt
                  </span>
                </div>
                <div className={`text-xs leading-relaxed rounded-xl px-4 py-3 border ${
                  log.isFlagged
                    ? "bg-red-500/[0.05] border-red-500/15 text-red-200/90"
                    : "bg-white/[0.02] border-white/5 text-foreground-subtle"
                }`}>
                  {log.promptText}
                </div>
              </div>

              {/* AI Response block */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">
                    AI Response
                  </span>
                </div>
                <div className="text-xs leading-relaxed rounded-xl px-4 py-3 bg-white/[0.02] border border-white/5 text-foreground-subtle max-h-48 overflow-y-auto custom-scrollbar">
                  {log.aiResponse}
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-foreground-subtle pt-1">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  ID: {log.id.slice(0, 12)}…
                </span>
                <span>|</span>
                <span>Student: {log.student?.email ?? "—"}</span>
                {log.student?.gradeLevel && (
                  <>
                    <span>|</span>
                    <span>Grade {log.student.gradeLevel}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<FilterMode>("all");

  const flaggedParam = useMemo(() => {
    if (filter === "flagged") return true;
    if (filter === "safe") return false;
    return undefined;
  }, [filter]);

  const { data, isLoading } = useAuditLogs({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    flagged: flaggedParam,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handlePrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const handleNext = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  // Reset to page 0 when filter changes
  const handleFilter = useCallback((mode: FilterMode) => {
    setFilter(mode);
    setPage(0);
  }, []);

  return (
    <div className="min-h-screen relative selection:bg-[#0D1B2A]/30">
      <GradientMesh />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-5 pb-24 lg:pb-8 px-4 md:px-6 lg:px-8"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="pt-6 pb-1">
          <div className="flex items-start gap-4">
            <a
              href="/dashboard/principal"
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-all mt-0.5"
            >
              <ArrowLeft className="w-4 h-4 text-foreground-subtle" />
            </a>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                AI Audit Logs
              </h1>
              <p className="text-foreground-subtle text-sm mt-1">
                Comprehensive record of all student AI interactions — review prompts, responses, and safety flags
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Toolbar: Filters + Pagination Summary ──────────── */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FilterButton
              label="All Logs"
              icon={<Eye className="w-3.5 h-3.5" />}
              active={filter === "all"}
              onClick={() => handleFilter("all")}
              count={total}
            />
            <FilterButton
              label="Flagged"
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
              active={filter === "flagged"}
              onClick={() => handleFilter("flagged")}
            />
            <FilterButton
              label="Safe"
              icon={<Shield className="w-3.5 h-3.5" />}
              active={filter === "safe"}
              onClick={() => handleFilter("safe")}
            />
          </div>

          <p className="text-[11px] text-foreground-subtle font-medium">
            Showing {logs.length > 0 ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} entries
          </p>
        </motion.div>

        {/* ── Audit Log Table ────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <GlassCard className="!p-0 overflow-hidden">
            {/* Column Headers (desktop) */}
            <div className="hidden md:grid grid-cols-[40px_36px_140px_1fr_100px_1fr_90px] gap-4 items-center px-6 py-3 border-b border-white/5 bg-white/[0.02]">
              <span /> {/* expand chevron */}
              <span /> {/* avatar */}
              <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">Date/Time</span>
              <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">Student</span>
              <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">Tool</span>
              <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest">Prompt</span>
              <span className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest text-right">Status</span>
            </div>

            {/* Rows */}
            {isLoading ? (
              <div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <RowSkeleton key={i} />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-foreground-subtle text-sm font-medium">
                  {filter === "flagged" ? "No Flagged Entries" : "No Audit Logs Found"}
                </p>
                <p className="text-foreground-subtle/60 text-xs mt-1">
                  {filter === "flagged"
                    ? "No safety violations have been detected"
                    : "Student AI interactions will appear here"}
                </p>
              </div>
            ) : (
              <div>
                {logs.map((log) => (
                  <AuditLogRow key={log.id} log={log} />
                ))}
              </div>
            )}

            {/* Pagination Footer */}
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <button
                  onClick={handlePrev}
                  disabled={page === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 bg-white/[0.02] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const pageNum = totalPages <= 5
                      ? i
                      : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                          pageNum === page
                            ? "bg-white/10 border border-white/15 text-white"
                            : "text-foreground-subtle hover:bg-white/5"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleNext}
                  disabled={page >= totalPages - 1}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 bg-white/[0.02] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
