"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

export function JoinButton({ groupBuyId, joined }: { groupBuyId: string; joined: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch("/api/group-buys/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupBuyId, units: 1 }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} className={joined ? "btn-secondary" : "btn-primary"} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : joined ? (
        <Check className="h-4 w-4" />
      ) : null}
      {joined ? "Joined" : "Join buy"}
    </button>
  );
}
