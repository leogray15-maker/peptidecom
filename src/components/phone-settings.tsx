"use client";

import { useState } from "react";
import { Check, Loader2, Phone } from "lucide-react";
import { PhoneField } from "@/components/phone-field";
import { formatPhone, normalizePhone } from "@/lib/phone";

/**
 * Contact number on the settings page.
 *
 * Signup asks for this now, but everyone who joined before it did has no number
 * on file — this is how they add one without us having to email and ask.
 */
export function PhoneSettings({ initial }: { initial: string | null }) {
  const [saved, setSaved] = useState<string | null>(initial);
  const [editing, setEditing] = useState(!initial);
  const [value, setValue] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const phone = normalizePhone(value);
    if (!phone) {
      setError("Include your country code, e.g. +44 7700 900123.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't save that.");
        return;
      }
      setSaved(data.phone ?? phone);
      setValue(data.phone ?? phone);
      setEditing(false);
      setDone(true);
    } catch {
      setError("Couldn't save that — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Phone className="h-4 w-4 text-brand-300" /> Contact number
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Used only to reach you about your order or a payment that needs sorting out.
      </p>

      {editing ? (
        <div className="mt-4 space-y-3">
          <PhoneField
            value={value}
            onChange={setValue}
            id="settings-phone"
            label="Mobile number"
            hint="Include your country code."
            required={false}
            disabled={busy}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={busy} className="btn-primary">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save number
            </button>
            {saved && (
              <button
                type="button"
                onClick={() => {
                  setValue(saved);
                  setEditing(false);
                  setError(null);
                }}
                disabled={busy}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-white">{formatPhone(saved)}</p>
          <div className="flex items-center gap-3">
            {done && (
              <span className="flex items-center gap-1 text-xs text-emerald-300">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <button type="button" onClick={() => setEditing(true)} className="btn-secondary">
              Change
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
