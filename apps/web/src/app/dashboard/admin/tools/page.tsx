"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  ChevronLeft,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  useAdminTools,
  useCreateTool,
  useDeleteTool,
} from "@web/hooks/use-admin";

const CATEGORIES = [
  "CHAT_AI",
  "CODE_AI",
  "IMAGE_AI",
  "WRITING_AI",
  "RESEARCH_AI",
] as const;

export default function AdminToolsPage() {
  const tools = useAdminTools();
  const createMut = useCreateTool();
  const deleteMut = useDeleteTool();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("CHAT_AI");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [subjects, setSubjects] = useState("");

  async function onCreate() {
    try {
      await createMut.mutateAsync({
        name: name.trim(),
        category,
        description: description.trim(),
        logoUrl: logoUrl.trim(),
        brandColor: brandColor.trim() || "#6366f1",
        subjects: subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        useCases: [],
      });
      setShowForm(false);
      setName("");
      setDescription("");
      setLogoUrl("");
      setSubjects("");
    } catch {
      /* ignore */
    }
  }

  async function onDelete(id: string, n: string) {
    if (!confirm(`Delete "${n}"? Existing assignments referencing it will lose the suggested-tool link.`)) return;
    await deleteMut.mutateAsync(id);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to admin
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-fuchsia-500/10 p-2 text-fuchsia-500">
            <Wrench className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">
              AI tool catalog
            </h1>
            <p className="text-sm text-foreground-muted">
              Curated list of AI tools your students can use. Teachers pick
              from this catalog when creating assignments.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-light"
          >
            <Plus className="h-3.5 w-3.5" />
            Add tool
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card space-y-3 overflow-hidden p-5"
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
              New tool
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">Name</span>
                <input
                  type="text"
                  className="input-base mt-1 w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ChatGPT"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Category</span>
                <select
                  className="input-base mt-1 w-full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium">Description</span>
              <textarea
                rows={3}
                className="input-base mt-1 w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this tool for?"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block text-sm md:col-span-2">
                <span className="font-medium">Logo URL</span>
                <input
                  type="url"
                  className="input-base mt-1 w-full"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Brand color</span>
                <input
                  type="color"
                  className="input-base mt-1 h-9 w-full p-0"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium">Subjects (comma separated)</span>
              <input
                type="text"
                className="input-base mt-1 w-full"
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="Science, Mathematics, English"
              />
            </label>
            {createMut.isError && (
              <p className="text-sm text-rose-600">
                {(createMut.error as Error)?.message ?? "Couldn’t create."}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-card-border px-3 py-1.5 text-sm hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={onCreate}
                disabled={
                  createMut.isPending ||
                  !name.trim() ||
                  !description.trim() ||
                  !logoUrl.trim()
                }
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-50"
              >
                {createMut.isPending ? "Creating…" : "Create tool"}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* List */}
      <section className="card overflow-hidden">
        {tools.isLoading ? (
          <div className="h-40 animate-pulse" />
        ) : !tools.data || tools.data.tools.length === 0 ? (
          <p className="p-10 text-center text-sm text-foreground-muted">
            No tools yet. Add one above to get started.
          </p>
        ) : (
          <ul className="divide-y divide-card-border">
            {tools.data.tools.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 p-4 hover:bg-surface/20"
              >
                <div
                  className="h-10 w-10 shrink-0 rounded-lg"
                  style={{ backgroundColor: t.brandColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-[11px] text-foreground-subtle">
                    <span className="rounded bg-surface px-1.5 py-0.5 font-semibold">
                      {t.category.replace(/_/g, " ")}
                    </span>
                    {t.subjects.length > 0 && ` · ${t.subjects.join(", ")}`}
                    {t.usageCount > 0 && ` · ${t.usageCount} uses`}
                  </p>
                </div>
                <a
                  href={t.logoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground-subtle hover:text-foreground"
                  title="View logo"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => onDelete(t.id, t.name)}
                  disabled={deleteMut.isPending}
                  className="text-rose-500 hover:text-rose-600 disabled:opacity-50"
                  title="Delete tool"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
