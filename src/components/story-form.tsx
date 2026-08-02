"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trophy, X } from "lucide-react";
import { compressDataUrl, compressImage } from "@/lib/image-compress";
import { STORY_IMAGE_MAX_CHARS } from "@/lib/story-images";
import { cn, formatDate } from "@/lib/utils";

interface PickerPhoto {
  id: string;
  takenAt: string;
  area: string | null;
  imageData: string;
}

/** One before/after slot: upload a photo, or pick one already in the member's
 * timeline. Both routes end up as a compressed data-URL on the story itself,
 * so the wall can render the pair without extra reads. */
function PhotoSlot({
  which,
  image,
  photos,
  loadPhotos,
  onPick,
  onClear,
}: {
  which: "before" | "after";
  image: string | null;
  photos: PickerPhoto[] | null;
  loadPhotos: () => void;
  onPick: (image: string, photoId: string | null) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(job: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await job();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't use that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-lab-border p-3">
      <p className="label !mb-2 capitalize">{which}</p>

      {image ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={`Your ${which} photo`} className="h-32 w-full rounded-lg object-cover" />
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${which} photo`}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-slate-200 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="btn-secondary w-full !py-6"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void run(async () => {
                onPick(await compressImage(file, STORY_IMAGE_MAX_CHARS), null);
              });
            }}
          />
          <button
            type="button"
            onClick={() => {
              setPicking((v) => !v);
              loadPhotos();
            }}
            className="w-full text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
          >
            {picking ? "Hide my timeline" : "or pick from my timeline"}
          </button>
        </div>
      )}

      {picking && !image && (
        <div className="mt-2">
          {photos === null ? (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading your photos…
            </p>
          ) : photos.length === 0 ? (
            <p className="text-xs text-slate-500">
              No photos in your timeline yet — upload one instead.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      onPick(await compressDataUrl(p.imageData, STORY_IMAGE_MAX_CHARS), p.id);
                      setPicking(false);
                    })
                  }
                  className="shrink-0 overflow-hidden rounded-xl border-2 border-transparent opacity-80 transition hover:opacity-100 focus-visible:border-brand-400"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageData} alt={formatDate(p.takenAt)} className="h-16 w-16 object-cover" />
                  <span className="block bg-lab-bg px-1 py-0.5 text-[9px] text-slate-500">
                    {formatDate(p.takenAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

/** Structured "share your story" flow. Guided prompts keep it low-friction,
 * before/after photos make it land, and marketing consent is genuinely
 * optional: strictly opt-in, off by default, with the wall working identically
 * either way. */
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
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PickerPhoto[] | null>(null);
  const [loadTimeline, setLoadTimeline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The member's timeline is only fetched once, and only if they ask for it —
  // it's a payload of full-size photos.
  useEffect(() => {
    if (!loadTimeline || photos !== null) return;
    fetch("/api/tsw/photos")
      .then((r) => (r.ok ? r.json() : { photos: [] }))
      .then((d) => setPhotos(Array.isArray(d.photos) ? d.photos : []))
      .catch(() => setPhotos([]));
  }, [loadTimeline, photos]);

  const loadPhotos = useCallback(() => setLoadTimeline(true), []);
  const hasPhotos = !!beforeImage || !!afterImage;

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
        beforeImage,
        afterImage,
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

      {/* Before & after — the part people scroll for. Open to everyone, not
       * gated behind marketing consent: these show on the members-only wall. */}
      <div className="space-y-3 rounded-xl border border-lab-border p-4">
        <div>
          <p className="text-sm font-medium text-slate-300">
            Before &amp; after <span className="text-slate-500">(optional)</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Two photos say what a paragraph can&apos;t. These appear on your story on the
            members-only wall — nowhere else, unless you tick the box below.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PhotoSlot
            which="before"
            image={beforeImage}
            photos={photos}
            loadPhotos={loadPhotos}
            onPick={(img, id) => {
              setBeforeImage(img);
              setBeforeId(id);
            }}
            onClear={() => {
              setBeforeImage(null);
              setBeforeId(null);
            }}
          />
          <PhotoSlot
            which="after"
            image={afterImage}
            photos={photos}
            loadPhotos={loadPhotos}
            onPick={(img, id) => {
              setAfterImage(img);
              setAfterId(id);
            }}
            onClear={() => {
              setAfterImage(null);
              setAfterId(null);
            }}
          />
        </div>
      </div>

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
            Arcane may share my story (words and first name) on its website, social media and
            marketing.
            <span className="mt-0.5 block text-xs text-slate-500">
              Completely optional — your story appears on the members-only wall either way, and
              you can withdraw this any time by contacting us.
            </span>
          </span>
        </label>
        {marketingConsent && (
          <label
            className={cn(
              "flex items-start gap-3",
              hasPhotos ? "cursor-pointer" : "cursor-not-allowed opacity-60"
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand-500"
              disabled={!hasPhotos}
              checked={photoConsent}
              onChange={(e) => setPhotoConsent(e.target.checked)}
            />
            <span className="text-sm text-slate-300">
              …and may include my before/after photos.
              <span className="mt-0.5 block text-xs text-slate-500">
                {hasPhotos
                  ? "Only the two photos above — never anything else from your timeline."
                  : "Add a before and after above to enable this."}
              </span>
            </span>
          </label>
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
