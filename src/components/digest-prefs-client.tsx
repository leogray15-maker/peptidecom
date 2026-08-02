"use client";

import { useState } from "react";
import { Check, Loader2, Moon } from "lucide-react";
import { type DigestPrefs, resolveDigestPrefs } from "@/lib/notifications";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        on ? "bg-brand-500" : "bg-lab-border"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

/**
 * Weekly insight digest preferences.
 *
 * Push defaults OFF and only turns on through this explicit toggle — required
 * for app store review of a health app, and the right default regardless.
 * Quiet hours are captured with the browser's UTC offset so "don't wake me at
 * 3am" means the member's 3am, not the server's.
 */
export function DigestPrefsClient({ initial }: { initial: DigestPrefs | null }) {
  const [prefs, setPrefs] = useState<DigestPrefs>(() => resolveDigestPrefs(initial));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: DigestPrefs) {
    setPrefs(next);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/tsw/digest-prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: next.enabled,
          inApp: next.inApp,
          quietStart: next.quietStart,
          quietEnd: next.quietEnd,
          // getTimezoneOffset() is minutes to add to local time to reach UTC;
          // we store the opposite convention.
          utcOffsetMinutes: -new Date().getTimezoneOffset(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save that.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-white">Weekly insight digest</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            One summary a week of your own patterns — your strongest link, your streak, and how
            the week went. Built from your logs only, and only sent if you ask for it.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between gap-4 border-t border-lab-border pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">Show it in the app</p>
            <p className="mt-0.5 text-xs text-slate-500">
              A card on your dashboard when a new digest is ready. No notification.
            </p>
          </div>
          <Switch on={prefs.inApp} onClick={() => save({ ...prefs, inApp: !prefs.inApp })} />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-lab-border pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">Send me a notification</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Off unless you turn it on. You can turn it off again at any time.
            </p>
          </div>
          <Switch
            on={prefs.enabled}
            onClick={() => {
              const next = !prefs.enabled;
              trackEvent(next ? "digest_opt_in" : "digest_opt_out");
              save({ ...prefs, enabled: next });
            }}
          />
        </div>

        {prefs.enabled && (
          <div className="border-t border-lab-border pt-4">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Moon className="h-4 w-4 text-brand-300" /> Quiet hours
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Nothing arrives between these times. A digest that lands inside the window waits
              until it&apos;s over rather than being dropped.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                className="input max-w-32"
                value={prefs.quietStart}
                onChange={(e) => save({ ...prefs, quietStart: Number(e.target.value) })}
                aria-label="Quiet hours start"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{hourLabel(h)}</option>
                ))}
              </select>
              <span className="text-sm text-slate-500">to</span>
              <select
                className="input max-w-32"
                value={prefs.quietEnd}
                onChange={(e) => save({ ...prefs, quietEnd: Number(e.target.value) })}
                aria-label="Quiet hours end"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{hourLabel(h)}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {saved && !saving && (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" /> Saved
          </>
        )}
        {error && <span className="text-rose-400">{error}</span>}
      </div>
    </div>
  );
}
