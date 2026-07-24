"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  type PlanId,
  PLAN_LIST,
  YEARLY_PER_MONTH,
  formatPrice,
} from "@/lib/membership";
import { cn } from "@/lib/utils";

export function PricingPlans() {
  const [plan, setPlan] = useState<PlanId>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
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

  const selected = PLAN_LIST.find((p) => p.id === plan)!;

  return (
    <div className="card !rounded-3xl">
      <div className="space-y-3">
        {PLAN_LIST.map((p) => {
          const active = p.id === plan;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition",
                active
                  ? "border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/40"
                  : "border-lab-border hover:border-brand-600/60"
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition",
                  active ? "border-brand-400 bg-brand-500" : "border-slate-600"
                )}
              >
                {active && <Check className="h-3.5 w-3.5 text-white" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{p.label}</span>
                  {p.badge && (
                    <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-200">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-400">{p.billedText}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-extrabold text-brand-200">{formatPrice(p.price)}</p>
                {p.id === "yearly" && (
                  <p className="text-[11px] text-slate-500">≈ £{YEARLY_PER_MONTH}/mo</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

      <button onClick={subscribe} className="btn-primary mt-5 w-full py-3" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Subscribe {selected.label} — {formatPrice(selected.price)}
        {selected.cadence}
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">
        Secure payment powered by Stripe · cancel anytime.
      </p>
    </div>
  );
}
