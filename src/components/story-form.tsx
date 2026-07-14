"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface PickerPhoto {
  id: string;
  takenAt: string;
  area: string | null;
  imageData: string;
}

/** Structured "share your story" flow. Guided prompts keep it low-friction,
 * and marketing consent is genuinely optional: strictly opt-in, off by
 * default, with the wall working identically either way. */
export function StoryForm({ autoOpen = false }: { autoOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [title, setTitle] = useState("");
  const [monthsIn, setMonthsIn] = useState("");
  const [body, setBody] = useState("");
  const [hardest, setHardest] = useState("");
  const [changed, setChanged] = useState("");
  const [advice, setAdvice] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PickerPhoto[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the member's photos only when the before/after picker is opened.
  useEffect(() => {
    if (!photoConsent || photos !== null) return;
    fetch("/api/tsw/photos")
      .then((r) => (r.ok ? r.json() : { photos: [] }))
      .then((d) => setPhotos(Array.isArray(d.photos) ? d.photos : []))
      .catch(() => setPhotos([]));
  }, [photoConsent, photos]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/tsw/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        monthsIn: monthsIn.trim() === "" ? null : parseInt(monthsIn, 10),
        prompts: {
          hardest: hardest.trim() || null,
          changed: changed.trim() || null,
          advice: advice.trim() || null,
        },
        marketingConsent,
        photoConsent: marketingConsent && photoConsent,
        beforePhotoId: beforeId,
        afterPhotoId: afterId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't post your story.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Trophy className="h-4 w-4" /> Share your story
      </button>
    );
  }

  const photoPick = (id: string, current: string | null, set: (v: string | null) => void) =>
    set(current === id ? null : id);

  return (
    <form onSubmit={submit} className="card space-y-4">
      <p className="text-sm text-slate-400">
        Someone in their worst week will read this. Tell them what it was like, what changed,
        and what you&apos;d say to yourself back then.
      </p>
      <input
        className="input"
        placeholder="Title — e.g. 18 months in: I wore short sleeves again"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
        maxLength={160}
      />
      <input
        className="input"
        type="number"
        min={0}
        max={600}
        placeholder="How many months into your journey are you? (optional)"
        value={monthsIn}
        onChange={(e) => setMonthsIn(e.target.value)}
      />
      <textarea
        className="input min-h-32"
        placeholder="Your story…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        minLength={20}
      />

      {/* Guided prompts — optional, but they make stories land harder. */}
      <div className="space-y-3 rounded-xl border border-lab-border p-4">
        <p className="text-sm font-medium text-slate-300">
          A few guided questions <span className="text-slate-500">(optional — answer any)</span>
        </p>
        <div>
          <label className="label">What was the hardest part?</label>
          <input className="input" value={hardest} maxLength={1000} onChange={(e) => setHardest(e.target.value)} />
        </div>
        <div>
          <label className="label">What changed?</label>
          <input className="input" value={changed} maxLength={1000} onChange={(e) => setChanged(e.target.value)} />
        </div>
        <div>
          <label className="label">What would you tell someone at the start?</label>
          <input className="input" value={advice} maxLength={1000} onChange={(e) => setAdvice(e.target.value)} />
        </div>
      </div>

      {/* Marketing consent — explicit, off by default, no tricks. */}
      <div className="space-y-3 rounded-xl border border-lab-border p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-500"
            checked={marketingConsent}
            onChange={(e) => {
              setMarketingConsent(e.target.checked);
              if (!e.target.checked) setPhotoConsent(false);
            }}
          />
          <span className="text-sm text-slate-300">
            Arcane may share my story (words and first name) in its social media and marketing.
            <span className="mt-0.5 block text-xs text-slate-500">
              Completely optional — your story appears on the members-only wall either way, and
              you can withdraw this any time by contacting us.
            </span>
          </span>
        </label>
        {marketingConsent && (
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand-500"
              checked={photoConsent}
              onChange={(e) => setPhotoConsent(e.target.checked)}
            />
            <span className="text-sm text-slate-300">
              …and may include the before/after photos I pick below.
              <span className="mt-0.5 block text-xs text-slate-500">
                Only the two photos you choose here — never anything else from your timeline.
              </span>
            </span>
          </label>
        )}
        {marketingConsent && photoConsent && (
          <div className="space-y-3">
            {photos === null ? (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading your photos…
              </p>
            ) : photos.length === 0 ? (
              <p className="text-xs text-slate-500">
                No photos in your timeline yet — you can share the story without them.
              </p>
            ) : (
              (["before", "after"] as const).map((which) => {
                const value = which === "before" ? beforeId : afterId;
                const set = which === "before" ? setBeforeId : setAfterId;
                return (
                  <div key={which}>
                    <p className="label !mb-1.5 capitalize">{which} photo</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {photos.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => photoPick(p.id, value, set)}
                          className={cn(
                            "shrink-0 overflow-hidden rounded-xl border-2 transition",
                            value === p.id ? "border-brand-400" : "border-transparent opacity-70 hover:opacity-100"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageData} alt={formatDate(p.takenAt)} className="h-16 w-16 object-cover" />
                          <span className="block bg-lab-bg px-1 py-0.5 text-[9px] text-slate-500">
                            {formatDate(p.takenAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Post to the wall
        </button>
      </div>
    </form>
  );
}
