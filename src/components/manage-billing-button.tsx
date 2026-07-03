"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error ?? "Could not open billing portal.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={open} className="btn-primary" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Manage billing
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
