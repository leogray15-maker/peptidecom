"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  GitCompareArrows,
  Loader2,
  Lock,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { BODY_ZONES, dateKey, daysBetween, zoneLabel } from "@/lib/tsw";
import { cn, formatDate } from "@/lib/utils";

export interface PhotoItem {
  id: string;
  takenAt: string;
  area: string | null;
  caption: string | null;
  imageData: string;
  shared: boolean;
}

/** Downscale + re-encode a photo client-side so it fits comfortably inside a
 * Firestore document. Returns a JPEG data-URL. */
async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't read that image."));
      el.src = url;
    });

    for (const [maxDim, quality] of [
      [1000, 0.72],
      [720, 0.6],
      [520, 0.5],
    ] as const) {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= 880_000) return data;
    }
    throw new Error("That image couldn't be compressed enough — try a smaller one.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PhotosClient({ initialPhotos }: { initialPhotos: PhotoItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState(dateKey());
  const [area, setArea] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_COMPARE = 4;
  const [compareMode, setCompareMode] = useState(false);
  const [compare, setCompare] = useState<PhotoItem[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const photos = initialPhotos; // sorted ascending by takenAt from the server
  const newestFirst = useMemo(() => [...photos].reverse(), [photos]);

  const byMonth = useMemo(() => {
    const groups = new Map<string, PhotoItem[]>();
    for (const p of newestFirst) {
      const month = new Date(p.takenAt + "T12:00").toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
      groups.set(month, [...(groups.get(month) ?? []), p]);
    }
    return [...groups.entries()];
  }, [newestFirst]);

  async function pick(file: File) {
    setError(null);
    try {
      setPreview(await compressImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that image.");
    }
  }

  async function upload() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/tsw/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        takenAt,
        area: area || null,
        caption: caption.trim() || null,
        imageData: preview,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    setPreview(null);
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function toggleShare(p: PhotoItem) {
    await fetch("/api/tsw/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, shared: !p.shared }),
    });
    router.refresh();
  }

  async function remove(p: PhotoItem) {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    await fetch(`/api/tsw/photos?id=${p.id}`, { method: "DELETE" });
    router.refresh();
  }

  function tapPhoto(p: PhotoItem) {
    if (!compareMode) return;
    setCompare((cur) => {
      if (cur.some((c) => c.id === p.id)) return cur.filter((c) => c.id !== p.id);
      // Room for up to four; picking a fifth swaps out the oldest pick.
      return [...cur.slice(-(MAX_COMPARE - 1)), p];
    });
  }

  /** "Today vs 90 days ago": newest photo vs the one closest to 90 days before it. */
  function quickCompare() {
    if (photos.length < 2) return;
    const latest = photos[photos.length - 1];
    const target = 90;
    let best = photos[0];
    let bestDiff = Infinity;
    for (const p of photos.slice(0, -1)) {
      const diff = Math.abs(daysBetween(p.takenAt, latest.takenAt) - target);
      if (diff < bestDiff) {
        best = p;
        bestDiff = diff;
      }
    }
    setCompare([best, latest]);
    setShowCompare(true);
  }

  // Oldest → newest so the overlay always reads left-to-right in time.
  const selected = useMemo(
    () => [...compare].sort((x, y) => x.takenAt.localeCompare(y.takenAt)),
    [compare]
  );
  const overlayOpen = showCompare && selected.length >= 2;

  // While the overlay is open: lock the page behind it, close on Escape, and
  // push a history entry so the phone's back button/gesture closes the overlay
  // instead of leaving the page.
  useEffect(() => {
    if (!overlayOpen) return;
    document.body.style.overflow = "hidden";
    window.history.pushState({ compareOverlay: true }, "");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCompare();
    };
    const onPop = () => setShowCompare(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayOpen]);

  function closeCompare() {
    if (window.history.state?.compareOverlay) {
      window.history.back(); // popstate handler flips showCompare off
    } else {
      setShowCompare(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Compare overlay */}
      {overlayOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm"
          onClick={closeCompare}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="w-full max-w-5xl rounded-3xl border border-lab-border bg-lab-card p-4 sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">
                  {daysBetween(selected[0].takenAt, selected[selected.length - 1].takenAt)} days apart
                </p>
                <button
                  onClick={closeCompare}
                  className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
                  aria-label="Close compare"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div
                className={cn(
                  "mt-4 grid gap-3 sm:gap-4",
                  selected.length === 2 && "grid-cols-1 sm:grid-cols-2",
                  selected.length === 3 && "grid-cols-1 sm:grid-cols-3",
                  selected.length === 4 && "grid-cols-2 sm:grid-cols-4"
                )}
              >
                {selected.map((p, i) => (
                  <figure key={p.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageData} alt={p.caption ?? `Photo from ${p.takenAt}`} className="w-full rounded-2xl object-cover" />
                    <figcaption className="mt-2 text-center text-xs text-slate-400 sm:text-sm">
                      <span className="font-medium text-slate-200">
                        {i === 0 ? "Then" : i === selected.length - 1 ? "Now" : formatDate(p.takenAt)}
                      </span>
                      {(i === 0 || i === selected.length - 1) && <> · {formatDate(p.takenAt)}</>}
                      {p.area && <> · {zoneLabel(p.area)}</>}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="mt-4 text-center text-sm text-slate-500">
                Healing is easier to see across months than across days. Be kind to the person in the earlier photo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating compare bar while picking */}
      {compareMode && !overlayOpen && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-6">
          <div className="flex items-center gap-2 rounded-2xl border border-lab-border bg-lab-card/95 p-2 shadow-xl shadow-black/40 backdrop-blur">
            <span className="px-2 text-sm font-medium text-slate-300">
              {compare.length}/{MAX_COMPARE} picked
            </span>
            <button
              onClick={() => setShowCompare(true)}
              disabled={compare.length < 2}
              className="btn-primary !py-2"
            >
              <GitCompareArrows className="h-4 w-4" /> Compare
            </button>
            <button
              onClick={() => {
                setCompareMode(false);
                setCompare([]);
              }}
              className="btn-secondary !py-2"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Upload */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white">Add today&apos;s photo</p>
            <p className="text-sm text-slate-500">
              Private by default — only you can see it unless you choose to share it.
            </p>
          </div>
          <div className="flex gap-2">
            {photos.length >= 2 && (
              <>
                <button onClick={quickCompare} className="btn-secondary">
                  <GitCompareArrows className="h-4 w-4" /> Now vs ~90 days ago
                </button>
                <button
                  onClick={() => {
                    setCompareMode((v) => !v);
                    setCompare([]);
                  }}
                  className={cn("btn-secondary", compareMode && "border-brand-500 text-brand-200")}
                >
                  {compareMode ? "Done picking" : "Pick photos to compare"}
                </button>
              </>
            )}
            <button onClick={() => fileRef.current?.click()} className="btn-primary">
              <Camera className="h-4 w-4" /> Choose photo
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
        />

        {compareMode && (
          <p className="mt-3 rounded-xl bg-brand-900/40 px-4 py-2 text-sm text-brand-200">
            Tap 2–4 photos below, then hit Compare to see them side by side.
          </p>
        )}

        {preview && (
          <div className="mt-5 grid gap-4 sm:grid-cols-[160px,1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="h-40 w-40 rounded-2xl object-cover" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Date taken</label>
                <input type="date" className="input" value={takenAt} max={dateKey()} onChange={(e) => setTakenAt(e.target.value)} />
              </div>
              <div>
                <label className="label">Area (optional)</label>
                <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="">Overall</option>
                  {BODY_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>{z.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Caption (optional)</label>
                <input className="input" value={caption} maxLength={500} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Day 3 of the flare calming down" />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <button onClick={upload} disabled={saving} className="btn-primary">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save to my timeline
                </button>
                <button onClick={() => setPreview(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      </div>

      {/* Timeline */}
      {photos.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="font-semibold text-white">Your timeline starts with one photo.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            On hard days it&apos;s nearly impossible to remember how far you&apos;ve come.
            Future-you will be very glad present-you pressed that button.
          </p>
        </div>
      ) : (
        byMonth.map(([month, items]) => (
          <div key={month}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">{month}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => {
                const pickIndex = compareMode ? compare.findIndex((c) => c.id === p.id) : -1;
                const picked = pickIndex !== -1;
                return (
                  <div
                    key={p.id}
                    onClick={() => tapPhoto(p)}
                    className={cn(
                      "card relative overflow-hidden !p-0 transition",
                      compareMode && "cursor-pointer hover:border-brand-500",
                      picked && "border-brand-400 ring-2 ring-brand-500/50"
                    )}
                  >
                    {picked && (
                      <span className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white shadow">
                        {pickIndex + 1}
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageData} alt={p.caption ?? `Photo from ${p.takenAt}`} className="aspect-square w-full object-cover" />
                    <div className="p-3">
                      <p className="text-xs font-medium text-slate-200">{formatDate(p.takenAt)}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {p.area ? zoneLabel(p.area) : "Overall"}
                        {p.caption ? ` · ${p.caption}` : ""}
                      </p>
                      {!compareMode && (
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleShare(p); }}
                            className={cn(
                              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition",
                              p.shared
                                ? "border-brand-500 bg-brand-500/15 text-brand-200"
                                : "border-lab-border text-slate-500 hover:text-slate-300"
                            )}
                            title={p.shared ? "Shared with the community — tap to make private" : "Private — tap to share with the community"}
                          >
                            {p.shared ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            {p.shared ? "Shared" : "Private"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); remove(p); }}
                            className="text-slate-600 hover:text-rose-400"
                            aria-label="Delete photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
