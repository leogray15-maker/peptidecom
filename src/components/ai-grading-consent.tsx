"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { CONSENT_COPY, CONSENT_VERSION } from "@/lib/ai-grading";

/**
 * One-time AI Flare Grading explainer. Blocks the tool until the member takes
 * an explicit affirmative action — a tap on "I understand", never a dismissible
 * toast and never an implied "by continuing you agree".
 *
 * Consent is recorded server-side against the account with a timestamp and the
 * copy version, so it survives a device change and re-prompts by itself when
 * the disclaimer is materially rewritten (CONSENT_VERSION bump).
 */
export function AiGradingConsentGate({ onAccepted }: { onAccepted: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tsw/ai-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: CONSENT_VERSION }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save that — please try again.");
        return;
      }
      onAccepted();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card !rounded-3xl">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold-500/12 text-gold-300 ring-1 ring-inset ring-gold-500/20">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white">{CONSENT_COPY.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{CONSENT_COPY.intro}</p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {CONSENT_COPY.points.map((point) => (
          <li key={point} className="flex gap-3 text-sm leading-relaxed text-slate-300">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={accept} disabled={saving} className="btn-primary">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {CONSENT_COPY.acceptLabel}
        </button>
        <Link href="/dashboard" className="btn-secondary">
          {CONSENT_COPY.declineLabel}
        </Link>
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        We record that you read this, when, and which version you read (v{CONSENT_VERSION}). If
        this wording ever changes materially you&apos;ll see it again — estimates you already
        made keep the version they were made under.
      </p>
    </div>
  );
}
