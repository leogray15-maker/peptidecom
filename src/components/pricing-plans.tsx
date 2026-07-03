"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Plan = "monthly" | "annual";

export function PricingPlans() {
  const [plan, setPlan] = useState<Plan>("monthly");
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

  return (
    <div className="card">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-lab-bg p-1">
        <button
          onClick={() => setPlan("monthly")}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition",
            plan === "monthly" ? "bg-brand-500 text-white" : "text-slate-300"
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setPlan("annual")}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition",
            plan === "annual" ? "bg-brand-500 text-white" : "text-slate-300"
          )}
        >
          Annual · save 2 months
        </button>
      </div>

      <div className="mt-6 text-center">
        {plan === "monthly" ? (
          <p className="text-4xl font-extrabold text-white">
            £25<span className="text-base font-medium text-slate-400">/month</span>
          </p>
        ) : (
          <p className="text-4xl font-extrabold text-white">
            £250<span className="text-base font-medium text-slate-400">/year</span>
          </p>
        )}
        <p className="mt-2 text-sm text-slate-400">Billed via Stripe · cancel anytime</p>
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

      <button onClick={subscribe} className="btn-primary mt-6 w-full py-3" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Subscribe & get access
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">
        Secure payment powered by Stripe.
      </p>
    </div>
  );
}
