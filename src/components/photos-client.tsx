"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Download,
  GitCompareArrows,
  Loader2,
  Lock,
  ScanEye,
  Stethoscope,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AiEstimateLabel } from "@/components/ai-estimate-label";
import {
  type PhotoEstimate,
  PHOTO_SCORE_VERSION,
  estimateAgreement,
} from "@/lib/photo-score";
import { gradePhoto } from "@/lib/photo-grade";
import {
  AI_ESTIMATE_LABEL,
  CONSENT_VERSION,
  NON_SKIN_MESSAGE,
  modelIdFor,
} from "@/lib/ai-grading";
import { downloadWatermarked } from "@/lib/watermark";
import { trackEvent } from "@/lib/analytics";
import { compressImage } from "@/lib/image-compress";
import { getConsent } from "@/lib/consent";
import { anyZoneLabel } from "@/lib/conditions";
import { BODY_ZONES, type BodyZone, dateKey, daysBetween } from "@/lib/tsw";
import { cn, formatDate } from "@/lib/utils";

export interface PhotoItem {
  id: string;
  takenAt: string;
  area: string | null;
  caption: string | null;
  imageData: string;
  shared: boolean;
  estimate: PhotoEstimate | null;
  /** Member-asserted "my dermatologist confirmed this grading". */
  dermConfirmed: boolean;
}

export function PhotosClient({
  initialPhotos,
  manualSeverityByDate,
  zones = BODY_ZONES,
  needsConsent = false,
}: {
  initialPhotos: PhotoItem[];
  manualSeverityByDate: Record<string, number>;
  /** The member's condition's zones — drives the "Area" picker. */
  zones?: BodyZone[];
  /** When true the account hasn't accepted the current AI grading disclaimer,
   * so uploads here are saved WITHOUT an estimate. The explainer lives on
   * /grade — this screen just doesn't quietly grade behind it. */
  needsConsent?: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState(dateKey());
  const [area, setArea] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<PhotoEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [skinFraction, setSkinFraction] = useState<number | null>(null);
  const [notSkin, setNotSkin] = useState(false);

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

  /** Free client-side severity estimate (canvas heuristic; local TF.js model
   * blended in when deployed — see src/lib/photo-score.ts & photo-model.ts).
   * Never calls any paid vision API. Best-effort: failure just means no chip. */
  async function estimateSeverity(dataUrl: string, forArea: string | null) {
    setEstimating(true);
    setEstimate(null);
    setNotSkin(false);
    try {
      // Baseline: the member's own photo from a day they rated calm, so skin
      // tone and typical lighting cancel out. Same pipeline the flare grading
      // tool uses — see lib/photo-grade.ts.
      const scored = initialPhotos
        .filter((p) => p.estimate)
        .map((p) => ({
          composite: p.estimate!.composite,
          area: p.area,
          takenAt: p.takenAt,
          version: p.estimate!.version,
        }));
      const result = await gradePhoto({
        dataUrl,
        scored,
        area: forArea,
        manualSeverityByDate,
      });
      if (!result.ok) {
        // "Not skin" gets its own message; too dark just stays silent here.
        if (result.reason === "too-little-skin") setNotSkin(true);
        return;
      }
      setSkinFraction(result.features.skinFraction);
      // Record which maths produced the number and which disclaimer the member
      // had accepted, so a stored grading stays attributable later.
      setEstimate({
        ...result.estimate,
        modelId: modelIdFor(result.estimate.method, PHOTO_SCORE_VERSION),
        consentVersion: CONSENT_VERSION,
      });
    } catch {
      // Estimation is supplementary — never block the upload on it.
    } finally {
      setEstimating(false);
    }
  }

  async function pick(file: File) {
    setError(null);
    try {
      const data = await compressImage(file);
      setPreview(data);
      setSkinFraction(null);
      setNotSkin(false);
      // Only run the on-device severity estimate if the member has accepted the
      // AI grading disclaimer AND hasn't opted out in Privacy & Sources.
      if (!needsConsent && getConsent("photoEstimate")) {
        void estimateSeverity(data, area || null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that image.");
    }
  }

  async function upload() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tsw/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          takenAt,
          area: area || null,
          caption: caption.trim() || null,
          imageData: preview,
          estimate,
          skinFraction,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      setPreview(null);
      setCaption("");
      setEstimate(null);
      setSkinFraction(null);
      setNotSkin(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  // How well the estimate has been tracking the member's own ratings —
  // validation before anyone is tempted to treat the number as authoritative.
  const agreement = useMemo(() => {
    const pairs: [number, number][] = [];
    for (const p of initialPhotos) {
      const manual = manualSeverityByDate[p.takenAt];
      if (p.estimate && manual != null) pairs.push([p.estimate.score, manual]);
    }
    return estimateAgreement(pairs);
  }, [initialPhotos, manualSeverityByDate]);

  async function toggleShare(p: PhotoItem) {
    setError(null);
    try {
      const res = await fetch("/api/tsw/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, shared: !p.shared }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't update the photo.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    }
  }

  /** "My dermatologist confirmed this grading." Data model + affordance only —
   * nothing reports on it yet, by design. */
  async function toggleDermConfirmed(p: PhotoItem) {
    setError(null);
    try {
      const res = await fetch("/api/tsw/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, dermConfirmed: !p.dermConfirmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't update the photo.");
        return;
      }
      trackEvent("derm_confirm_toggled", { on: !p.dermConfirmed });
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    }
  }

  /** Export a photo with the disclaimer burned in beneath it, so the label
   * can't be cropped off without cropping the picture too. */
  async function exportPhoto(p: PhotoItem) {
    setError(null);
    try {
      await downloadWatermarked(p.imageData, `arcane-${p.takenAt}.jpg`, {
        caption: p.estimate
          ? `Estimate ${p.estimate.score}/100 · ${formatDate(p.takenAt)}${p.area ? ` · ${anyZoneLabel(p.area)}` : ""}`
          : `${formatDate(p.takenAt)}${p.area ? ` · ${anyZoneLabel(p.area)}` : ""}`,
        modelId: p.estimate?.modelId ?? null,
      });
    } catch {
      setError("Couldn't prepare that image for download.");
    }
  }

  async function remove(p: PhotoItem) {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/tsw/photos?id=${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't delete the photo.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    }
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
                      {p.area && <> · {anyZoneLabel(p.area)}</>}
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

      {/* Floating compare bar while picking. bottom-28 clears the tab bar on
          phones; it sits low on desktop where there isn't one. */}
      {compareMode && !overlayOpen && (
        <div className="fixed inset-x-0 bottom-28 z-40 flex justify-center px-4 lg:bottom-6">
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
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="h-40 w-40 rounded-2xl object-cover" />
              {estimating ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Estimating…
                </p>
              ) : notSkin ? (
                <p className="mt-2 text-[11px] leading-snug text-slate-500">
                  {NON_SKIN_MESSAGE} You can still save it to your timeline — it just won&apos;t
                  get an estimate.
                </p>
              ) : estimate ? (
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className="badge border border-brand-500/40 bg-brand-500/10 text-brand-200"
                    title="A free, on-device colour analysis of this photo. Your own rating in the daily tracker is what counts."
                  >
                    <ScanEye className="h-3 w-3" /> est. {estimate.score}/100
                  </span>
                  <button
                    type="button"
                    onClick={() => setEstimate(null)}
                    className="text-slate-600 hover:text-slate-300"
                    aria-label="Discard the estimate"
                    title="Don't save this estimate"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
              {estimate && (
                <>
                  <AiEstimateLabel size="sm" className="mt-1.5" />
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    Computed on your device to help you describe this flare. Your tracker rating
                    stays the real record.
                  </p>
                </>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Date taken</label>
                <input type="date" className="input" value={takenAt} max={dateKey()} onChange={(e) => setTakenAt(e.target.value)} />
              </div>
              <div>
                <label className="label">Area (optional)</label>
                <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="">Overall</option>
                  {zones.map((z) => (
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

      {/* Estimate calibration — validate the heuristic against the member's
          own ratings before it earns any trust. */}
      {agreement && (
        <div className="card !py-4">
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <ScanEye className="h-4 w-4 shrink-0 text-brand-300" />
            {agreement.r >= 0.5 ? (
              <>
                The photo estimate has been tracking your own ratings well so far
                ({agreement.n} matched days). Still an experiment — your rating is the record.
              </>
            ) : agreement.r >= 0.2 ? (
              <>
                The photo estimate loosely follows your own ratings ({agreement.n} matched days).
                Treat it as a curiosity for now.
              </>
            ) : (
              <>
                The photo estimate isn&apos;t matching your own ratings yet ({agreement.n} matched
                days) — trust your slider, not the number.
              </>
            )}
          </p>
        </div>
      )}

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
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-200">{formatDate(p.takenAt)}</p>
                        {p.estimate && (
                          <span
                            className="flex shrink-0 items-center gap-1 text-[10px] text-slate-500"
                            title="Experimental on-device severity estimate (0–100)"
                          >
                            <ScanEye className="h-3 w-3" /> ~{p.estimate.score}
                          </span>
                        )}
                      </div>
                      {/* Persistent, non-dismissible on every graded photo. */}
                      {p.estimate && <AiEstimateLabel size="sm" className="mt-1" />}
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {p.area ? anyZoneLabel(p.area) : "Overall"}
                        {p.caption ? ` · ${p.caption}` : ""}
                      </p>
                      {p.estimate && !compareMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleDermConfirmed(p); }}
                          className={cn(
                            "mt-2 flex w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition",
                            p.dermConfirmed
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                              : "border-lab-border text-slate-500 hover:text-slate-300"
                          )}
                          title={
                            p.dermConfirmed
                              ? "You marked this estimate as confirmed by your dermatologist — tap to unmark"
                              : "Mark this estimate as confirmed by your dermatologist"
                          }
                        >
                          <Stethoscope className="h-3 w-3 shrink-0" />
                          {p.dermConfirmed ? "Derm confirmed" : "Confirmed by my derm?"}
                        </button>
                      )}
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); exportPhoto(p); }}
                              className="text-slate-600 hover:text-brand-300"
                              aria-label="Download this photo"
                              title={`Download — the “${AI_ESTIMATE_LABEL}” label is burned into the file`}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); remove(p); }}
                              className="text-slate-600 hover:text-rose-400"
                              aria-label="Delete photo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
