"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Images,
  Loader2,
  RotateCcw,
  ScanEye,
  ShieldCheck,
} from "lucide-react";
import { ScoreRing, TONE_TEXT } from "@/components/score-ring";
import {
  type PhotoEstimate,
  PHOTO_SCORE_VERSION,
  estimateAgreement,
  extractImageFeatures,
  flareBand,
  pickBaseline,
  scorePhoto,
} from "@/lib/photo-score";
import { loadPhotoModel } from "@/lib/photo-model";
import { compressImage } from "@/lib/image-compress";
import { getConsent, setConsent, syncConsents } from "@/lib/consent";
import { anyZoneLabel } from "@/lib/conditions";
import { type BodyZone, dateKey } from "@/lib/tsw";
import { cn } from "@/lib/utils";

/** A previously graded photo, used as the personal baseline. */
export interface GradedPhoto {
  takenAt: string;
  area: string | null;
  composite: number;
  score: number;
}

export function GradeClient({
  graded,
  manualSeverityByDate,
  zones,
}: {
  graded: GradedPhoto[];
  manualSeverityByDate: Record<string, number>;
  zones: BodyZone[];
}) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const [area, setArea] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<PhotoEstimate | null>(null);
  const [usedBaseline, setUsedBaseline] = useState(false);
  const [working, setWorking] = useState(false);
  const [tooDark, setTooDark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // The consent switch isn't visible to the server render, so reading it during
  // the first render would make the client's HTML disagree with the server's
  // and break hydration. null = "not read yet". The cached value settles it
  // immediately; the account copy (which may have been changed on another
  // device) lands a moment later.
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    setAllowed(getConsent("photoEstimate"));
    void syncConsents().then((c) => setAllowed(c.photoEstimate));
  }, []);

  const band = estimate ? flareBand(estimate.score) : null;

  /** How well the estimate has tracked this member's own tracker ratings. */
  const agreement = useMemo(() => {
    const pairs: [number, number][] = [];
    for (const p of graded) {
      const manual = manualSeverityByDate[p.takenAt];
      if (manual != null) pairs.push([p.score, manual]);
    }
    return estimateAgreement(pairs);
  }, [graded, manualSeverityByDate]);

  async function grade(file: File) {
    setError(null);
    setTooDark(false);
    setEstimate(null);
    setSaved(false);
    setWorking(true);
    try {
      const data = await compressImage(file);
      setPreview(data);

      const features = await extractImageFeatures(data);
      const baseline = pickBaseline(graded, area || null);
      const heuristic = scorePhoto(features, baseline);
      if (heuristic == null) {
        // Too dark or blown out to judge — say so rather than invent a number.
        setTooDark(true);
        return;
      }
      setUsedBaseline(!!baseline);

      let score = heuristic;
      let method: PhotoEstimate["method"] = "heuristic";
      const model = await loadPhotoModel();
      if (model) {
        const img = new Image();
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error("decode failed"));
          img.src = data;
        });
        const modelScore = await model.predict(img);
        if (modelScore != null) {
          score = Math.round((heuristic + modelScore) / 2);
          method = "blended";
        }
      }

      setEstimate({
        score,
        composite: features.composite,
        inflamedFraction: features.inflamedFraction,
        rednessIndex: features.rednessIndex,
        version: PHOTO_SCORE_VERSION,
        method,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that image.");
    } finally {
      setWorking(false);
    }
  }

  async function saveToTimeline() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tsw/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          takenAt: dateKey(),
          area: area || null,
          caption: null,
          imageData: preview,
          estimate,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save to your timeline.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setPreview(null);
    setEstimate(null);
    setTooDark(false);
    setError(null);
    setSaved(false);
    if (cameraRef.current) cameraRef.current.value = "";
    if (libraryRef.current) libraryRef.current.value = "";
  }

  // ── Before consent is known (server render + first paint) ────────────────
  if (allowed === null) {
    return <div className="card !rounded-3xl h-64 animate-pulse" aria-hidden />;
  }

  // ── Opted out ────────────────────────────────────────────────────────────
  if (!allowed) {
    return (
      <div className="card !rounded-3xl py-10 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-brand-300" />
        <p className="mt-3 font-semibold text-white">Photo grading is switched off</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
          You turned off on-device photo grading in Privacy &amp; Sources. Turn it back on to
          use this tool — the photo still never leaves your device.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              setConsent("photoEstimate", true);
              setAllowed(true);
            }}
            className="btn-primary"
          >
            Turn it back on
          </button>
          <Link href="/privacy-sources" className="btn-secondary">
            Privacy &amp; Sources
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Capture */}
      <div className="card !rounded-3xl">
        {!preview ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-500/12 text-brand-300 ring-1 ring-inset ring-brand-500/20">
              <ScanEye className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-semibold text-white">Photograph an itchy patch</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
              Fill the frame with the patch in even, natural light. You&apos;ll get a 0–100
              estimate of how inflamed it looks — worked out on your device.
            </p>

            <div className="mt-5 w-full max-w-xs">
              <label className="label">Which area? (optional)</label>
              <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Not specified</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                Picking the area lets us compare against your own calmest photo of the same
                place, so skin tone and lighting cancel out.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={() => cameraRef.current?.click()} disabled={working} className="btn-primary">
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {working ? "Grading…" : "Take a photo"}
              </button>
              <button onClick={() => libraryRef.current?.click()} disabled={working} className="btn-secondary">
                <Images className="h-4 w-4" /> Choose from library
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="The photo being graded"
              className="h-40 w-40 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              {working ? (
                <p className="flex items-center justify-center gap-2 text-sm text-slate-400 sm:justify-start">
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading the photo on your device…
                </p>
              ) : tooDark ? (
                <>
                  <p className="font-semibold text-white">Too dark or too bright to grade</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Most of this photo is deep shadow or blown-out highlight. Try again in even,
                    natural light — daylight near a window works best.
                  </p>
                </>
              ) : estimate && band ? (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                  <ScoreRing score={estimate.score} tone={band.tone} />
                  <div>
                    <p className={cn("text-lg font-bold", TONE_TEXT[band.tone])}>{band.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{band.blurb}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {usedBaseline
                        ? "Scored against your own calmest photo."
                        : "Absolute scale — grade a few photos and it starts comparing against your own calmest one."}
                      {area ? ` · ${anyZoneLabel(area)}` : ""}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <button onClick={reset} className="btn-secondary">
                  <RotateCcw className="h-4 w-4" /> Grade another
                </button>
                {estimate && (
                  <button onClick={saveToTimeline} disabled={saving || saved} className="btn-primary">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saved ? "Saved to timeline ✓" : "Save to my timeline"}
                  </button>
                )}
              </div>
              {saved && (
                <p className="mt-2 text-xs text-slate-500">
                  <Link href="/photos" className="text-brand-300 hover:text-brand-200">
                    View your photo timeline →
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Camera on phones; library picker everywhere. */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && grade(e.target.files[0])}
        />
        <input
          ref={libraryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && grade(e.target.files[0])}
        />

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      </div>

      {/* What went into the number */}
      {estimate && (
        <div className="card !rounded-3xl">
          <h2 className="font-semibold text-white">What the estimate looked at</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center justify-between border-b border-lab-border py-2 text-sm">
              <span className="text-slate-400">Area reading as inflamed</span>
              <span className="font-semibold tabular-nums text-slate-200">
                {Math.round(estimate.inflamedFraction * 100)}%
              </span>
            </li>
            <li className="flex items-center justify-between border-b border-lab-border py-2 text-sm">
              <span className="text-slate-400">Redness intensity</span>
              <span className="font-semibold tabular-nums text-slate-200">
                {Math.round(estimate.rednessIndex * 100) / 100}
              </span>
            </li>
            <li className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-400">Method</span>
              <span className="font-semibold text-slate-200">
                {estimate.method === "heuristic" ? "Colour analysis" : "Colour analysis + local model"}
              </span>
            </li>
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            All of this is computed in your browser from the photo&apos;s colours. Nothing is
            uploaded unless you choose to save it to your timeline.
          </p>
        </div>
      )}

      {/* Calibration against the member's own ratings */}
      {agreement && (
        <div className="card !rounded-3xl !py-4">
          <p className="flex items-start gap-2 text-sm text-slate-400">
            <ScanEye className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
            <span>
              {agreement.r >= 0.5 ? (
                <>
                  This estimate has been tracking your own tracker ratings well so far
                  ({agreement.n} matched days). Still an experiment — your rating is the record.
                </>
              ) : agreement.r >= 0.2 ? (
                <>
                  This estimate loosely follows your own tracker ratings ({agreement.n} matched
                  days). Treat it as a curiosity for now.
                </>
              ) : (
                <>
                  This estimate isn&apos;t matching your own tracker ratings yet ({agreement.n}{" "}
                  matched days) — trust your slider, not the number.
                </>
              )}
            </span>
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Educational estimate only — not a diagnosis, and no substitute for a clinician. It reads
        colour, so it can be thrown off by lighting, makeup, moisturiser shine and camera
        white balance, and it is far less reliable on deeper skin tones, where inflammation shows
        as violet or grey-brown rather than red. Your own rating in the daily tracker stays the
        real record.
      </p>
    </div>
  );
}
