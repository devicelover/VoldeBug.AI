"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ChevronLeft,
  Mail,
  CheckCircle2,
  AlertCircle,
  Copy,
  Send,
} from "lucide-react";
import { useMe, useRequestConsent } from "@web/hooks/use-me";

export default function ParentalConsentPage() {
  const me = useMe();
  const request = useRequestConsent();

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentRelationship, setParentRelationship] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onRequest() {
    setCopied(false);
    setGeneratedUrl(null);
    try {
      const result = await request.mutateAsync({
        parentName,
        parentEmail,
        parentRelationship,
      });
      setGeneratedUrl(result.consentUrl);
    } catch {
      /* surfaced via request.error */
    }
  }

  async function copyUrl() {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore clipboard errors */
    }
  }

  const consentStatus = me.data?.consentStatus ?? "NOT_REQUIRED";
  const needsRequest =
    consentStatus === "PENDING" ||
    consentStatus === "EXPIRED" ||
    consentStatus === "DENIED";

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to settings
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">
              Parental consent
            </h1>
            <p className="text-sm text-foreground-muted">
              Required by India&rsquo;s DPDP Act 2023 for users under 18.
            </p>
          </div>
        </div>
      </div>

      {/* Status panel */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card p-5"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
          Status
        </p>
        <p className="mt-1 font-display text-lg font-semibold">
          {{
            NOT_REQUIRED: "Not required",
            PENDING: "Awaiting parent",
            GRANTED: "Granted",
            DENIED: "Denied",
            EXPIRED: "Link expired",
          }[consentStatus] ?? consentStatus}
        </p>

        {consentStatus === "GRANTED" && (
          <p className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Your parent has approved your use of Voldebug.
          </p>
        )}
        {consentStatus === "NOT_REQUIRED" && (
          <p className="mt-2 text-sm text-foreground-muted">
            Either you&rsquo;re 18 or older, or no date-of-birth is on file
            yet. If you&rsquo;re a minor, add your date of birth in
            settings — we&rsquo;ll then prompt you to request consent.
          </p>
        )}
        {needsRequest && (
          <p className="mt-2 inline-flex items-center gap-1 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4" />
            {consentStatus === "EXPIRED"
              ? "The previous consent link expired. Send a new one."
              : consentStatus === "DENIED"
                ? "Your previous request was declined. You can ask again."
                : "Please ask a parent or guardian to grant consent."}
          </p>
        )}
      </motion.section>

      {/* Request form */}
      {needsRequest && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="card space-y-4 p-5"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground-subtle">
            Request consent
          </h2>

          <label className="block text-sm">
            <span className="font-medium">Parent / guardian name</span>
            <input
              type="text"
              className="input-base mt-1 w-full"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Full name"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Parent / guardian email</span>
            <input
              type="email"
              className="input-base mt-1 w-full"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="parent@example.com"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Relationship</span>
            <input
              type="text"
              className="input-base mt-1 w-full"
              value={parentRelationship}
              onChange={(e) => setParentRelationship(e.target.value)}
              placeholder="e.g. mother, father, legal guardian"
            />
          </label>

          {request.isError && (
            <p className="text-sm text-rose-600">
              {(request.error as Error)?.message ?? "Couldn’t create request."}
            </p>
          )}

          <div className="flex justify-end">
            <button
              onClick={onRequest}
              disabled={
                request.isPending ||
                !parentName.trim() ||
                !parentEmail.trim() ||
                !parentRelationship.trim()
              }
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-light disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {request.isPending ? "Generating link…" : "Generate consent link"}
            </button>
          </div>
        </motion.section>
      )}

      {/* Generated link */}
      {generatedUrl && (
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-3 border-emerald-300 p-5 dark:border-emerald-800/60"
        >
          <p className="flex items-center gap-2 font-semibold">
            <Mail className="h-4 w-4 text-emerald-600" />
            Send this link to your parent
          </p>
          <p className="text-xs text-foreground-muted">
            Until our automatic email service is configured, please copy
            this link and send it via WhatsApp, SMS, or email yourself.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-surface p-2 text-xs">
            <code className="flex-1 truncate">{generatedUrl}</code>
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-1 rounded border border-card-border bg-background px-2 py-1 hover:bg-surface/70"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </motion.section>
      )}
    </div>
  );
}
