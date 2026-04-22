"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Receipt,
  Users,
  School,
  Calendar,
  Mail,
  ExternalLink,
} from "lucide-react";
import { useAdminDashboard } from "@web/hooks/use-admin";

// Pricing tiers (matches the strategy doc you committed earlier).
// When a real billing backend lands (Razorpay / Stripe India), this page
// becomes the source of truth. For now it's a transparency/upgrade
// landing — schools see what plan they're on and what the seat usage is.
const TIERS = [
  {
    key: "starter",
    name: "Starter",
    pricePerStudent: 500,
    features: [
      "Student app + teacher dashboard",
      "AI Activity Log + integrity flags",
      "Basic analytics",
    ],
  },
  {
    key: "school",
    name: "School",
    pricePerStudent: 1200,
    highlight: true,
    features: [
      "Everything in Starter",
      "Admin console + school settings",
      "AI misuse detection (full)",
      "Parent portal + WhatsApp digests",
      "Google / Microsoft SSO",
      "ERP integrations",
    ],
  },
  {
    key: "premier",
    name: "Premier",
    pricePerStudent: 2000,
    features: [
      "Everything in School",
      "White-labelling (logo, brand color, custom domain)",
      "Capstone portfolio export",
      "Board-aligned outcome reports",
      "Dedicated faculty hours",
    ],
  },
];

export default function AdminBillingPage() {
  const overview = useAdminDashboard();
  const studentCount = overview.data?.totalStudents ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6 md:p-10">
      <div>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to admin
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Plan &amp; billing</h1>
            <p className="text-sm text-foreground-muted">
              Your current plan, seat usage, and upgrade options. Voldebug
              is in pilot mode — billing isn&rsquo;t automated yet, contact
              us to upgrade.
            </p>
          </div>
        </div>
      </div>

      {/* Current plan summary */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-3 md:grid-cols-3"
      >
        <Stat
          icon={<Users className="h-5 w-5" />}
          label="Students enrolled"
          value={studentCount}
          tone="sky"
        />
        <Stat
          icon={<School className="h-5 w-5" />}
          label="Classes"
          value={overview.data?.totalClasses ?? 0}
          tone="violet"
        />
        <Stat
          icon={<Calendar className="h-5 w-5" />}
          label="Plan"
          value="Pilot"
          tone="amber"
          secondary="Free during pilot phase"
        />
      </motion.section>

      {/* Pricing tiers */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {TIERS.map((tier) => {
          const annual = tier.pricePerStudent * studentCount;
          return (
            <div
              key={tier.key}
              className={`card p-5 ${
                tier.highlight
                  ? "border-accent/50 shadow-lg shadow-accent/10"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">{tier.name}</h3>
                {tier.highlight && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-light">
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-2 text-3xl font-bold">
                ₹{tier.pricePerStudent.toLocaleString("en-IN")}
                <span className="text-xs font-normal text-foreground-subtle">
                  {" "}
                  / student / year
                </span>
              </p>
              {studentCount > 0 && (
                <p className="mt-1 text-xs text-foreground-subtle">
                  ≈ ₹{annual.toLocaleString("en-IN")} for your{" "}
                  {studentCount} students
                </p>
              )}
              <ul className="mt-4 space-y-1.5 text-xs text-foreground-muted">
                {tier.features.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
              <a
                href="mailto:meet@voldebug.in?subject=Voldebug%20plan%20upgrade"
                className={`mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tier.highlight
                    ? "bg-accent text-white hover:bg-accent-light"
                    : "border border-card-border text-foreground-muted hover:bg-surface"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Talk to us
              </a>
            </div>
          );
        })}
      </motion.section>

      {/* Billing not yet automated note */}
      <section className="card flex items-start gap-3 p-4">
        <Receipt className="mt-0.5 h-4 w-4 text-amber-500" />
        <div className="flex-1 text-xs text-foreground-muted">
          <p className="font-medium text-foreground">
            Automatic billing is in development
          </p>
          <p className="mt-1">
            We&rsquo;ll add Razorpay-based per-seat billing once the pilot
            phase ends. Until then, contact{" "}
            <a
              href="mailto:meet@voldebug.in"
              className="text-accent-light hover:underline"
            >
              meet@voldebug.in
            </a>{" "}
            to upgrade or download a GST-compliant invoice.
          </p>
        </div>
        <a
          href="https://voldebug.in"
          target="_blank"
          rel="noreferrer"
          className="text-foreground-subtle hover:text-foreground"
          title="Visit voldebug.in"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  secondary,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  secondary?: string;
  tone: "sky" | "violet" | "amber";
}) {
  const tones: Record<typeof tone, string> = {
    sky: "bg-sky-500/10 text-sky-500",
    violet: "bg-fuchsia-500/10 text-fuchsia-500",
    amber: "bg-amber-500/10 text-amber-500",
  };
  return (
    <div className="card p-4">
      <div
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        {icon}
      </div>
      <p className="stat-number text-2xl">{value}</p>
      <p className="text-xs text-foreground-subtle">{label}</p>
      {secondary && (
        <p className="mt-0.5 text-[11px] text-foreground-subtle">{secondary}</p>
      )}
    </div>
  );
}
