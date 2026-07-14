"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { CONDITIONS } from "@/lib/conditions";
import { cn } from "@/lib/utils";

async function saveCondition(condition: string): Promise<boolean> {
  const res = await fetch("/api/tsw/condition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ condition }),
  });
  return res.ok;
}

/** Shared option grid — used by the onboarding modal and the Settings page. */
function ConditionOptions({
  value,
  onPick,
  disabled,
}: {
  value: string | null;
  onPick: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {CONDITIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(c.id)}
          className={cn(
            "rounded-xl border px-4 py-3 text-left transition",
            value === c.id
              ? "border-brand-500 bg-brand-500/15"
              : "border-lab-border hover:border-brand-700"
          )}
        >
          <p className="text-sm font-semibold text-white">
            {c.emoji} {c.label}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{c.blurb}</p>
        </button>
      ))}
    </div>
  );
}

const DISMISS_KEY = "condition-picker-dismissed";

/** First-visit onboarding modal: shown (once per session if dismissed) until
 * the member has a condition on their profile. Existing accounts see TSW
 * pre-selected — one tap to confirm, or pick what actually fits. */
export function ConditionPickerModal({ hasLoggedBefore }: { hasLoggedBefore: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(hasLoggedBefore ? "tsw" : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1"
  );

  if (hidden) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  }

  async function confirm() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const ok = await saveCondition(selected);
    setSaving(false);
    if (!ok) {
      setError("Couldn't save — please try again.");
      return;
    }
    setHidden(true);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-lab-border bg-lab-card p-6 shadow-2xl sm:p-8">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-300"
          aria-label="Not now"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-white">What are you tracking?</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          The tracker, stages and trigger suggestions adapt to your condition. You can change
          this any time in Settings.
        </p>
        <div className="mt-5">
          <ConditionOptions value={selected} onPick={setSelected} disabled={saving} />
        </div>
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        <button
          onClick={confirm}
          disabled={!selected || saving}
          className="btn-primary mt-5 w-full py-3"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} That&apos;s me — let&apos;s go
        </button>
      </div>
    </div>
  );
}

/** Settings variant: current condition with instant save on pick. */
export function ConditionSettings({ current }: { current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(id: string) {
    if (id === value || saving) return;
    setValue(id);
    setSaving(true);
    setSaved(false);
    setError(null);
    const ok = await saveCondition(id);
    setSaving(false);
    if (!ok) {
      setValue(current);
      setError("Couldn't save — please try again.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <ConditionOptions value={value} onPick={pick} disabled={saving} />
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        {saving ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </>
        ) : saved ? (
          <>
            <Check className="h-3 w-3 text-emerald-400" /> Saved. Stages and suggestions now match.
          </>
        ) : (
          "Your logged history stays intact when you switch."
        )}
      </p>
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
