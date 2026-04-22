"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTools, type Tool } from "@web/hooks/use-tools";
import { GradientMesh } from "@web/components/ui/background";
import {
  Search,
  Bot,
  Code2,
  Pen,
  Image,
  BookOpen,
  ExternalLink,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Zap,
  X,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "", label: "All Tools", icon: Sparkles },
  { key: "CHAT_AI", label: "Chat AI", icon: Bot },
  { key: "CODE_AI", label: "Code AI", icon: Code2 },
  { key: "IMAGE_AI", label: "Image AI", icon: Image },
  { key: "WRITING_AI", label: "Writing AI", icon: Pen },
  { key: "RESEARCH_AI", label: "Research AI", icon: BookOpen },
];

const CATEGORY_COLORS: Record<string, string> = {
  CHAT_AI: "#6366f1",
  CODE_AI: "#06b6d4",
  IMAGE_AI: "#ec4899",
  WRITING_AI: "#22c55e",
  RESEARCH_AI: "#f59e0b",
};

const CATEGORY_LABEL: Record<string, string> = {
  CHAT_AI: "Chat AI",
  CODE_AI: "Code AI",
  IMAGE_AI: "Image AI",
  WRITING_AI: "Writing AI",
  RESEARCH_AI: "Research AI",
};

// ─── Sub-components ───────────────────────────────────────────────────────

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const color = tool.brandColor || CATEGORY_COLORS[tool.category] || "#6366f1";
  const catLabel = CATEGORY_LABEL[tool.category] || tool.category;

  return (
    <motion.a
      href={`/dashboard/tools/${tool.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
      className="card group flex flex-col gap-4 p-5 transition-transform hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {tool.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold">{tool.name}</p>
          <span
            className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {catLabel}
          </span>
        </div>
        <ExternalLink className="h-4 w-4 flex-shrink-0 text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-foreground-muted">
        {tool.description}
      </p>

      <div className="flex items-center justify-between border-t border-card-border pt-1">
        <div className="flex items-center gap-1 text-xs text-foreground-subtle">
          <TrendingUp className="h-3 w-3" />
          <span>{tool.usageCount.toLocaleString()} uses</span>
        </div>
        <span className="flex items-center gap-0.5 text-xs text-accent-light group-hover:underline">
          Open <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </motion.a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce server-side search.
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((window as unknown as { __searchTimer?: number }).__searchTimer);
    (window as unknown as { __searchTimer?: number }).__searchTimer = window.setTimeout(
      () => setDebouncedSearch(val),
      300,
    );
  }, []);

  // Server filters via the Prisma WHERE — no JS post-filter, no demo
  // fallback. If the DB is empty the user sees a "catalog being curated"
  // empty state instead of stale hardcoded data.
  const { data: tools, isLoading } = useTools({
    category: activeCategory || undefined,
    search: debouncedSearch || undefined,
  });

  const items = tools ?? [];

  return (
    <div className="relative min-h-screen">
      <GradientMesh />

      <div className="mx-auto max-w-6xl px-4 pb-24 md:px-6 lg:px-8 lg:pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-1 pb-2 pt-6"
        >
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Zap className="h-6 w-6 text-accent-light" />
            AI Tools Library
          </h1>
          <p className="text-sm text-foreground-muted">
            Curated AI tools your school approves for student use. Click any
            tool for usage instructions, example prompts, and pro tips.
          </p>
        </motion.div>

        {/* Search + Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="sticky top-14 z-30 -mx-4 space-y-3 border-b border-white/5 bg-bg/80 px-4 py-4 backdrop-blur-sm md:-mx-6 md:px-6"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search tools by name or description…"
              className="input-base pl-10 pr-10"
              aria-label="Search AI tools"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                  activeCategory === cat.key
                    ? "bg-accent text-white shadow-md shadow-accent/20"
                    : "border border-card-border bg-surface/40 text-foreground-muted hover:bg-surface/70 hover:text-foreground"
                }`}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mb-3 mt-4 flex items-center justify-between">
          <p className="text-xs text-foreground-subtle">
            {isLoading
              ? "Loading…"
              : `${items.length} tool${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card h-44 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
              <Search className="h-8 w-8 text-foreground-subtle opacity-40" />
            </div>
            <p className="mb-1 font-display text-base font-semibold">
              {debouncedSearch || activeCategory
                ? "No tools match your filters"
                : "Your school’s tool catalog is empty"}
            </p>
            <p className="max-w-sm text-sm text-foreground-subtle">
              {debouncedSearch || activeCategory
                ? "Try a different search term or category."
                : "Ask your admin to add tools at /dashboard/admin/tools — they’ll appear here for everyone."}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((tool, i) => (
                <ToolCard key={tool.id} tool={tool} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
