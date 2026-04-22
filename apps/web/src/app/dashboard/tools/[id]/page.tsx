"use client";

import { motion } from "framer-motion";
import { useTool } from "@web/hooks/use-tools";
import { GradientMesh } from "@web/components/ui/background";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  Tag,
  ChevronRight,
  Zap,
} from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  CHAT_AI: "Chat AI",
  CODE_AI: "Code AI",
  IMAGE_AI: "Image AI",
  WRITING_AI: "Writing AI",
  RESEARCH_AI: "Research AI",
};

// Generic fallback steps when an admin hasn't yet authored howTo entries
// for a tool. Better than blank, but the empty state is the real cue
// for the admin to fill them in via /dashboard/admin/tools.
const GENERIC_HOW_TO = [
  "Open the tool in a new tab using the button above",
  "Sign in or create a free account if required",
  "Type your question or paste your prompt",
  "Read the response carefully — verify any factual claims",
  "Log this interaction on your AI Activity Log",
];

const GENERIC_TIPS = [
  "Be specific in your prompts — the more context, the better the response",
  "Use the AI to think alongside you, not instead of you",
  "Always verify important facts against a trusted source",
];

export default function ToolDetailPage({ params }: { params: { id: string } }) {
  const { data: tool, isLoading, isError } = useTool(params.id);

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="font-display text-lg">Tool not found</p>
        <a
          href="/dashboard/tools"
          className="mt-2 inline-block text-sm text-accent-light hover:underline"
        >
          Back to tools
        </a>
      </div>
    );
  }

  const t = tool;
  const color = t?.brandColor || "#6366f1";
  // Prefer real authored content; fall back to a generic helpful set so
  // a freshly-added tool isn't a blank page.
  const howTo = t?.howTo && t.howTo.length > 0 ? t.howTo : GENERIC_HOW_TO;
  const examplePrompts =
    t?.examplePrompts && t.examplePrompts.length > 0
      ? t.examplePrompts
      : (t?.useCases ?? []).map((uc) => `Help me with: ${uc}`);
  const proTips =
    t?.proTips && t.proTips.length > 0 ? t.proTips : GENERIC_TIPS;

  // Real website URL when authored; never fall back to a Google search.
  const openUrl = t?.websiteUrl;

  return (
    <div className="relative min-h-screen">
      <GradientMesh />

      <div className="mx-auto max-w-4xl px-4 pb-24 md:px-6 lg:px-8 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 pt-4"
        >
          <a
            href="/dashboard/tools"
            className="inline-flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </a>
        </motion.div>

        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-32 rounded-2xl bg-surface/50" />
            <div className="h-48 rounded-2xl bg-surface/50" />
          </div>
        )}

        {!isLoading && t && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Hero card */}
            <div
              className="relative overflow-hidden rounded-2xl border p-6 md:p-8"
              style={{
                background: `linear-gradient(135deg, ${color}10, ${color}05)`,
                borderColor: `${color}25`,
              }}
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-[60px]"
                style={{ backgroundColor: `${color}20` }}
              />

              <div className="relative z-10 flex flex-wrap items-start gap-5">
                <div
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: color }}
                >
                  {t.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl font-bold">{t.name}</h1>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {CATEGORY_LABEL[t.category] ?? t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-foreground-muted">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {t.usageCount.toLocaleString()} students used this tool
                    </span>
                  </div>
                </div>
                {openUrl ? (
                  <a
                    href={openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 4px 20px ${color}40`,
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Tool
                  </a>
                ) : (
                  <span
                    className="inline-flex items-center gap-2 rounded-xl border border-card-border px-5 py-2.5 text-sm font-medium text-foreground-subtle"
                    title="The school admin hasn't set a website URL for this tool yet"
                  >
                    URL coming soon
                  </span>
                )}
              </div>

              <p className="relative z-10 mt-5 text-sm leading-relaxed text-foreground/80">
                {t.description}
              </p>
            </div>

            {/* Use Cases + Subjects */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="card p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-foreground-muted">
                  <Lightbulb className="h-4 w-4" />
                  Use Cases
                </h2>
                {t.useCases.length === 0 ? (
                  <p className="text-sm text-foreground-subtle">
                    No use cases listed yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {t.useCases.map((uc, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                        {uc}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-foreground-muted">
                  <Tag className="h-4 w-4" />
                  Subjects
                </h2>
                {t.subjects.length === 0 ? (
                  <p className="text-sm text-foreground-subtle">
                    Not yet tagged to specific subjects.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {t.subjects.map((s, i) => (
                      <span key={i} className="tag">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* How to use */}
            <div className="card p-5">
              <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-semibold">
                <BookOpen className="h-5 w-5 text-accent-light" />
                How to use {t.name}
              </h2>
              <ol className="space-y-3">
                {howTo.map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-start gap-3"
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{step}</span>
                  </motion.li>
                ))}
              </ol>
            </div>

            {/* Example prompts + Pro tips */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="card p-5">
                <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-foreground-muted">
                  Example prompts
                </h2>
                {examplePrompts.length === 0 ? (
                  <p className="text-sm text-foreground-subtle">
                    No example prompts yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {examplePrompts.map((p, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3 text-xs font-mono leading-relaxed text-foreground/80"
                        style={{
                          backgroundColor: `${color}08`,
                          border: `1px solid ${color}18`,
                        }}
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-foreground-muted">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Pro tips
                </h2>
                <ul className="space-y-3">
                  {proTips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-light" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div
              className="card p-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${color}08, transparent)`,
                borderColor: `${color}20`,
              }}
            >
              <p className="mb-2 font-display text-base font-semibold">
                Ready to try {t.name}?
              </p>
              <p className="mb-4 text-sm text-foreground-muted">
                Open the tool, complete your assignment, and log your prompts
                on the AI Activity Log to earn XP.
              </p>
              {openUrl ? (
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 4px 20px ${color}30`,
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open {t.name}
                </a>
              ) : (
                <a
                  href="/dashboard/ai-chat"
                  className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-surface px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface/70"
                >
                  Use Voldebug Chat instead
                </a>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
