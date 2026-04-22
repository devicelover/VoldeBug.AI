"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import {
  useRosterImport,
  useAdminClasses,
  type RosterRow,
  type RosterImportResult,
} from "@web/hooks/use-admin";

// Minimal CSV parser. Handles quoted fields with embedded commas.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (field !== "" || current.length > 0) {
          current.push(field);
          rows.push(current);
          current = [];
          field = "";
        }
        if (ch === "\r" && text[i + 1] === "\n") i++;
      } else {
        field += ch;
      }
    }
  }
  if (field !== "" || current.length > 0) {
    current.push(field);
    rows.push(current);
  }
  return rows;
}

const SAMPLE_CSV = `name,email,role,gradeLevel,classId
Riya Sharma,riya@example.in,STUDENT,9,
Arjun Kumar,arjun@example.in,STUDENT,9,
Priya Mehta,priya@example.in,TEACHER,,
`;

export default function RosterImportPage() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<RosterRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [result, setResult] = useState<RosterImportResult | null>(null);
  const importMut = useRosterImport();
  const classes = useAdminClasses({ limit: 100 });

  const onParse = useCallback(() => {
    setParseErrors([]);
    setParsed([]);
    setResult(null);
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setParseErrors(["CSV looks empty. Need a header row + at least one data row."]);
      return;
    }
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const need = ["name", "email", "role"];
    for (const k of need) {
      if (!header.includes(k)) {
        setParseErrors([
          `Missing required column "${k}". Expected: name, email, role, gradeLevel?, classId?`,
        ]);
        return;
      }
    }
    const idx = {
      name: header.indexOf("name"),
      email: header.indexOf("email"),
      role: header.indexOf("role"),
      gradeLevel: header.indexOf("gradelevel"),
      classId: header.indexOf("classid"),
    };
    const out: RosterRow[] = [];
    const errs: string[] = [];
    rows.slice(1).forEach((r, i) => {
      const lineNo = i + 2;
      const name = (r[idx.name] ?? "").trim();
      const email = (r[idx.email] ?? "").trim();
      const role = (r[idx.role] ?? "").trim().toUpperCase();
      const gradeLevel = idx.gradeLevel >= 0 ? (r[idx.gradeLevel] ?? "").trim() : "";
      const classId = idx.classId >= 0 ? (r[idx.classId] ?? "").trim() : "";

      if (!name || !email || !role) {
        errs.push(`Line ${lineNo}: missing required field`);
        return;
      }
      if (role !== "STUDENT" && role !== "TEACHER") {
        errs.push(`Line ${lineNo}: role must be STUDENT or TEACHER`);
        return;
      }
      out.push({
        name,
        email,
        role,
        gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
        classId: classId || undefined,
      });
    });
    setParseErrors(errs);
    setParsed(out);
  }, [text]);

  async function onImport() {
    if (parsed.length === 0) return;
    try {
      const r = await importMut.mutateAsync(parsed);
      setResult(r);
    } catch {
      /* surfaced via importMut.error */
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voldebug-roster-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to admin
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
            <Upload className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">
              Bulk roster import
            </h1>
            <p className="text-sm text-foreground-muted">
              Paste your school&rsquo;s student/teacher list as CSV. Existing
              accounts are updated; new ones get a temporary password.
            </p>
          </div>
          <button
            onClick={downloadSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-surface"
          >
            <Download className="h-3.5 w-3.5" />
            Download sample
          </button>
        </div>
      </div>

      {/* Format help */}
      <section className="card space-y-2 p-4 text-xs">
        <p className="font-semibold">CSV format</p>
        <p className="text-foreground-muted">
          Required columns: <code>name</code>, <code>email</code>,{" "}
          <code>role</code> (STUDENT or TEACHER).
          <br />
          Optional: <code>gradeLevel</code> (1-12), <code>classId</code>{" "}
          (paste an existing class ID to enroll students).
        </p>
        {classes.data && classes.data.classes.length > 0 && (
          <details>
            <summary className="cursor-pointer text-accent-light">
              Show your existing class IDs
            </summary>
            <ul className="mt-1 space-y-0.5 font-mono text-[11px]">
              {classes.data.classes.map((c) => (
                <li key={c.id}>
                  {c.name}: <code>{c.id}</code>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Paste area */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card space-y-3 p-5"
      >
        <textarea
          rows={10}
          className="input-base w-full font-mono text-xs"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE_CSV}
        />
        <div className="flex justify-end">
          <button
            onClick={onParse}
            disabled={!text.trim()}
            className="rounded-lg border border-card-border px-3 py-1.5 text-sm hover:bg-surface disabled:opacity-50"
          >
            Parse CSV
          </button>
        </div>
      </motion.section>

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="card border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/10 dark:text-rose-300">
          <p className="mb-1 inline-flex items-center gap-1 font-semibold">
            <AlertCircle className="h-4 w-4" />
            Parse problems
          </p>
          <ul className="list-disc pl-5">
            {parseErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {parsed.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-card-border p-3">
            <p className="text-sm font-semibold">
              <FileText className="mr-1.5 inline h-4 w-4" />
              {parsed.length} rows ready
            </p>
            <button
              onClick={onImport}
              disabled={importMut.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {importMut.isPending ? "Importing…" : "Import all"}
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="text-foreground-subtle">
                <tr className="border-b border-card-border">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2 text-right">Class</th>
                  <th className="p-2 text-right">ClassId</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((r, i) => (
                  <tr key={i} className="border-b border-card-border/60">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.email}</td>
                    <td className="p-2">{r.role}</td>
                    <td className="p-2 text-right">{r.gradeLevel ?? "—"}</td>
                    <td className="p-2 text-right font-mono text-[10px]">
                      {r.classId ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}

      {/* Result */}
      {result && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card space-y-2 border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-800/40 dark:bg-emerald-900/10"
        >
          <p className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Import complete
          </p>
          <ul className="text-xs text-foreground-muted">
            <li>{result.created} accounts created</li>
            <li>{result.updated} accounts updated</li>
            <li>{result.addedToClass} students added to a class</li>
            {result.errors.length > 0 && (
              <li className="text-rose-600">
                {result.errors.length} errors:
                <ul className="ml-4 list-disc">
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      {e.email}: {e.reason}
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </motion.section>
      )}
    </div>
  );
}
