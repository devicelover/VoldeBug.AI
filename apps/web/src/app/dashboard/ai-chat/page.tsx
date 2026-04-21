"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  BookOpen,
  Brain,
  Info,
} from "lucide-react";
import { useSendChat, type ChatMessage } from "@web/hooks/use-chat";
import { useAssignments } from "@web/hooks/use-dashboard";
import { PromptSuggestions } from "@web/components/chat/prompt-suggestions";

// ─── Types ────────────────────────────────────────────────────────────────

interface VisibleMessage extends ChatMessage {
  id: string;
  timestamp: string;
  integrityFlags?: string[];
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AiChatPage() {
  const [messages, setMessages] = useState<VisibleMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"default" | "socratic">("default");
  const [assignmentId, setAssignmentId] = useState<string>("");

  const assignmentsQ = useAssignments();
  const send = useSendChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, send.isPending]);

  const assignmentOptions = useMemo(() => {
    const all = assignmentsQ.data ?? [];
    return all
      .filter((a) => a.status === "PUBLISHED")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 15);
  }, [assignmentsQ.data]);

  // Subject is inferred server-side from the assignment→lesson-plan link
  // (see chat.suggestions.ts). We leave this undefined so the server
  // handles the look-up; the client just passes the assignment ID.
  const subjectForSuggestions: string | undefined = undefined;

  const handlePick = useCallback((prompt: string) => {
    setInput((prev) => (prev ? `${prev}\n${prompt}` : prompt));
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: VisibleMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    const nextHistory: VisibleMessage[] = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");

    try {
      const result = await send.mutateAsync({
        messages: nextHistory.map(({ role, content }) => ({ role, content })),
        assignmentId: assignmentId || undefined,
        mode,
      });
      setMessages((m) => [
        // Tag the user message in-place with the integrity flags we
        // just got back from the server.
        ...m.map((msg) =>
          msg.id === userMsg.id
            ? { ...msg, integrityFlags: result.integrity.flagReasons }
            : msg,
        ),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.reply.content,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `⚠️ ${(err as Error).message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [input, messages, mode, assignmentId, send]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2 text-accent-light">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Voldebug Chat</h1>
            <p className="text-xs text-foreground-subtle">
              A transparent AI assistant. Every message is logged to your AI
              Activity Log so your process is visible to your teacher.
            </p>
          </div>
        </div>
      </header>

      {/* Controls row */}
      <section className="card flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-2 text-xs">
          <BookOpen className="h-3.5 w-3.5 text-foreground-subtle" />
          <span className="whitespace-nowrap text-foreground-muted">
            Linked assignment
          </span>
          <select
            className="input-base w-full text-xs"
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
          >
            <option value="">— None —</option>
            {assignmentOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2 text-xs">
          <span className="whitespace-nowrap text-foreground-muted">Mode</span>
          <div className="inline-flex rounded-lg border border-card-border bg-surface/40 p-0.5">
            <button
              onClick={() => setMode("default")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mode === "default"
                  ? "bg-accent text-white"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setMode("socratic")}
              title="AI only asks you questions — it won't give you answers directly."
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mode === "socratic"
                  ? "bg-accent text-white"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Brain className="h-3 w-3" />
              Socratic
            </button>
          </div>
        </div>
      </section>

      {/* Messages */}
      <section className="card min-h-[420px] flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md space-y-3 py-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-accent-light" />
            <p className="font-display text-lg font-semibold">
              Start a conversation
            </p>
            <p className="text-sm text-foreground-muted">
              Pick a suggested prompt below, or write your own. Remember:
              the goal is to think <em>with</em> the AI, not instead of it.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-accent text-white"
                    : "bg-surface text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {m.content}
                </p>
                {m.integrityFlags && m.integrityFlags.length > 0 && (
                  <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                    <AlertTriangle className="h-3 w-3" />
                    Flagged: {m.integrityFlags.join(", ").replace(/_/g, " ")}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {send.isPending && (
          <div className="flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-2 text-sm text-foreground-muted">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground-subtle" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground-subtle [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground-subtle [animation-delay:300ms]" />
            </div>
            Thinking…
          </div>
        )}

        <div ref={bottomRef} />
      </section>

      {/* Suggestions */}
      <PromptSuggestions
        subject={subjectForSuggestions}
        assignmentId={assignmentId || undefined}
        onPick={handlePick}
      />

      {/* Composer */}
      <section className="card p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask something — Enter to send, Shift+Enter for a new line"
          rows={3}
          className="input-base w-full resize-none border-0 focus:ring-0"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="flex items-center gap-1 text-[11px] text-foreground-subtle">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Every message is logged for academic integrity.
          </p>
          <button
            onClick={handleSend}
            disabled={!input.trim() || send.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </section>

      {/* Footer hint */}
      <p className="inline-flex items-center gap-1 text-[11px] text-foreground-subtle">
        <Info className="h-3 w-3" />
        Want to see what you&rsquo;ve asked so far?{" "}
        <Link href="/dashboard/ai-log" className="underline hover:text-foreground">
          Open your AI Activity Log
        </Link>
        .
      </p>
    </div>
  );
}
