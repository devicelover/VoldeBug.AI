"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Public (unauthenticated) parental-consent page. A parent reaches it via
// an email link the school sends after a minor student signs up. Token
// is the credential — see apps/api/src/modules/consent/consent.service.ts.
//
// DPDP Act 2023 §9(1): verifiable parental consent for data processing
// of children (<18). This page captures the parent's name, email,
// relationship, and a GRANT/DENY decision, plus the IP the decision
// came from (server-side), which together form our verifiability chain.

interface ConsentView {
  status: "PENDING" | "GRANTED" | "DENIED" | "EXPIRED";
  expired: boolean;
  tokenExpiresAt: string;
  respondedAt: string | null;
  student: { name: string | null; email: string | null } | null;
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Request failed");
  return json.data as T;
}

export default function ParentalConsentPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [view, setView] = useState<ConsentView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentRelationship, setParentRelationship] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<"GRANTED" | "DENIED" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchJson<ConsentView>(`/api/proxy/consent/${token}`)
      .then((v) => alive && setView(v))
      .catch((e) => alive && setLoadError((e as Error).message));
    return () => {
      alive = false;
    };
  }, [token]);

  async function decide(grant: boolean) {
    setSubmitError(null);
    if (!parentName || !parentEmail || !parentRelationship) {
      setSubmitError("Please fill in name, email, and relationship.");
      return;
    }
    setLoading(true);
    try {
      // Public endpoint — no Authorization header. Hit the API directly
      // instead of the proxy route (which requires a session).
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${apiUrl}/v1/consent/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant,
          parentName,
          parentEmail,
          parentRelationship,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Submission failed");
      setSubmitted(grant ? "GRANTED" : "DENIED");
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-2xl font-semibold">Link not valid</h1>
        <p className="mt-2 text-sm text-zinc-500">{loadError}</p>
      </main>
    );
  }

  if (!view) {
    return (
      <main className="mx-auto max-w-xl p-8 text-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  if (view.expired || view.status === "EXPIRED") {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-semibold">This link has expired</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Please ask the school to send a new consent request.
        </p>
      </main>
    );
  }

  if (submitted || view.status !== "PENDING") {
    const finalStatus = submitted ?? view.status;
    return (
      <main className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-2xl font-semibold">
          Consent {finalStatus === "GRANTED" ? "granted" : "declined"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Thank you. Your decision has been recorded.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Parental consent request</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {view.student?.name ?? "A student"} has signed up for the Voldebug AI
        Education Portal. Because they are under 18, India's Digital Personal
        Data Protection Act, 2023, requires a parent or guardian to grant
        consent before the school can process their personal data for
        educational activities on the platform.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Your full name</span>
          <input
            type="text"
            className="mt-1 w-full rounded border border-zinc-300 p-2"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Your email</span>
          <input
            type="email"
            className="mt-1 w-full rounded border border-zinc-300 p-2"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Relationship to student</span>
          <input
            type="text"
            className="mt-1 w-full rounded border border-zinc-300 p-2"
            placeholder="e.g. mother, father, legal guardian"
            value={parentRelationship}
            onChange={(e) => setParentRelationship(e.target.value)}
          />
        </label>
      </div>

      {submitError && (
        <p className="mt-4 text-sm text-red-600">{submitError}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
          onClick={() => decide(true)}
          disabled={loading}
        >
          I grant consent
        </button>
        <button
          className="rounded border border-zinc-300 px-4 py-2 disabled:opacity-60"
          onClick={() => decide(false)}
          disabled={loading}
        >
          I decline
        </button>
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Your decision, name, email, and IP address will be recorded as
        evidence of consent under the DPDP Act 2023. You may withdraw
        consent at any time by contacting the school.
      </p>
    </main>
  );
}
