"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Timer } from "lucide-react";
import type { FoundingStatus } from "@/lib/membership";

function useCountdown(deadlineIso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(deadlineIso).getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  return { days, hours, mins, secs, done: diff === 0 };
}

export function PricingPlans({ founding }: { founding: FoundingStatus }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { days, hours, mins, secs } = useCountdown(founding.deadline);
  const isFounding = founding.open;

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={isFounding ? "card border-gold-500/40" : "card"}>
      {isFounding ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="badge border border-gold-500/40 bg-gold-500/10 text-gold-200">
              <Lock className="h-3.5 w-3.5" /> Founding offer
            </span>
            <span className="text-xs font-semibold text-gold-300">
              {founding.remaining} of {founding.limit} spots left
            </span>
          </div>

          <div className="mt-5 text-center">
            <p className="text-4xl font-extrabold text-white">
              £{founding.intro}
              <span className="text-base font-medium text-slate-400"> first month</span>
            </p>
            <p className="mt-2 text-sm text-slate-300">
              then <span className="font-semibold text-white">£{founding.founding}/month</span> —
              locked in for life
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Price goes to £{founding.standard}/month once the offer closes.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/5 py-2.5 text-sm text-gold-200">
            <Timer className="h-4 w-4" />
            <span className="tabular-nums font-semibold">
              {days}d {hours}h {mins}m {secs}s
            </span>
            <span className="text-gold-300/70">left</span>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-4xl font-extrabold text-white">
            £{founding.standard}
            <span className="text-base font-medium text-slate-400">/month</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">Billed monthly via Stripe · cancel anytime</p>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

      <button onClick={subscribe} className="btn-primary mt-6 w-full py-3" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isFounding ? "Claim your founding spot" : "Subscribe & get access"}
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">
        Secure payment powered by Stripe.
      </p>
    </div>
  );
}
