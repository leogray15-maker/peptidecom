"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Images,
  Loader2,
  RotateCcw,
  ScanEye,
  ShieldCheck,
} from "lucide-react";
import { ScoreRing, TONE_TEXT } from "@/components/score-ring";
import { AboutThisEstimate, AiEstimateLabel } from "@/components/ai-estimate-label";
import { AiGradingConsentGate } from "@/components/ai-grading-consent";
import {
  type PhotoEstimate,
  PHOTO_SCORE_VERSION,
  type PhotoRejection,
  CALM_MANUAL_SEVERITY,
  QUALITY_FLAG_COPY,
  type SignReadout,
  estimateAgreement,
  flareBand,
  signReadout,
} from "@/lib/photo-score";
import { EASI_AREA_BANDS, EASI_SIGN_BANDS } from "@/lib/easi";
import { FlareRegionMap } from "@/components/flare-region-map";
import { gradePhoto } from "@/lib/photo-grade";
import {
  CONSENT_VERSION,
  NON_SKIN_MESSAGE,
  confidenceLabel,
  methodLabel,
  modelIdFor,
} from "@/lib/ai-grading";
import { compressImage } from "@/lib/image-compress";
import { getConsent, setConsent, syncConsents } from "@/lib/consent";
import { anyZoneLabel } from "@/lib/conditions";
import { type BodyZone, dateKey } from "@/lib/tsw";
import { cn } from "@/lib/utils";

/** One row of the clinician-facing read-out. */
function ReadoutRow({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-lab-border pb-2 text-sm">
      <span className="min-w-0">
        <span className="text-slate-300">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{hint}</span>
      </span>
      <span className="shrink-0 font-semibold tabular-nums text-white">{value}</span>
    </li>
  );
}

/**
 * Which way things have moved since the last photo of this area.
 *
 * The change is only called a change when it clears the estimate's own margin
 * of error. Two readings inside the same interval are the same reading, and
 * saying "down 4" about them would manufacture progress out of noise.
 */
function TrendLine({
  score,
  previous,
  margin,
}: {
  score: number;
  previous: GradedPhoto;
  margin: number;
}) {
  const delta = score - previous.score;
  const days = daysBetween(previous.takenAt, dateKey());
  const when = days <= 0 ? "earlier today" : days === 1 ? "yesterday" : `${days} days ago`;

  if (Math.abs(delta) <= margin) {
    return (
      <p className="mt-1.5 text-xs text-slate-400">
        About the same as your last photo of this area ({previous.score}/100, {when}) — the
        difference is inside the estimate&apos;s margin of error.
      </p>
    );
  }
  return (
    <p className={cn("mt-1.5 text-xs font-medium", delta < 0 ? "text-emerald-300" : "text-rose-300")}>
      {delta < 0 ? "↓" : "↑"} {Math.abs(delta)} points vs your last photo of this area (
      {previous.score}/100, {when}).
    </p>
  );
}

/** Whole days between two YYYY-MM-DD keys. */
function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Number.isNaN(ms) ? 0 : Math.round(ms / 86_400_000);
}

/** A previously graded photo, used as the personal baseline. */
export interface GradedPhoto {
  takenAt: string;
  area: string | null;
  composite: number;
  score: number;
  /** Heuristic version that produced `composite` — older ones aren't comparable. */
  version: number;
}

export function GradeClient({
  graded,
  manualSeverityByDate,
  zones,
  needsConsent,
}: {
  graded: GradedPhoto[];
  manualSeverityByDate: Record<string, number>;
  zones: BodyZone[];
  /** Server-resolved: has this account accepted the current disclaimer version? */
  needsConsent: boolean;
}) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const [area, setArea] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<PhotoEstimate | null>(null);
  const [readout, setReadout] = useState<SignReadout | null>(null);
  const [skinFraction, setSkinFraction] = useState<number | null>(null);
  const [usedBaseline, setUsedBaseline] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [consented, setConsented] = useState(!needsConsent);
  const [working, setWorking] = useState(false);
  const [rejected, setRejected] = useState<PhotoRejection | null>(null);
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

  /** The last estimate for this same area, so the result can say which way
   * things have moved rather than leaving the member to compare two numbers
   * across two screens. Same-area only — comparing a face to a shin is noise,
   * and same-version only, since v2 composites aren't comparable to v3 ones. */
  const previous = useMemo(() => {
    if (!area) return null;
    const today = dateKey();
    const prior = graded
      .filter((p) => p.area === area && p.version === PHOTO_SCORE_VERSION && p.takenAt < today)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
    return prior[0] ?? null;
  }, [graded, area]);

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
    setRejected(null);
    setEstimate(null);
    setReadout(null);
    setSkinFraction(null);
    setSaved(false);
    setWorking(true);
    try {
      const data = await compressImage(file);
      setPreview(data);

      const result = await gradePhoto({
        dataUrl: data,
        scored: graded,
        area: area || null,
        manualSeverityByDate,
      });
      if (!result.ok) {
        // Too dark, or not enough skin in frame — say which rather than
        // invent a number. A screenshot or a photo of the cat lands here.
        setRejected(result.reason);
        return;
      }
      setSkinFraction(result.features.skinFraction);
      setUsedBaseline(!!result.baseline);
      setReadout(signReadout(result.features));
      // Record which maths produced the number and which disclaimer version
      // the member had accepted when it was produced.
      setEstimate({
        ...result.estimate,
        modelId: modelIdFor(result.estimate.method, PHOTO_SCORE_VERSION),
        consentVersion: CONSENT_VERSION,
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
          skinFraction,
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
    setReadout(null);
    setSkinFraction(null);
    setRejected(null);
    setShowAbout(false);
    setError(null);
    setSaved(false);
    if (cameraRef.current) cameraRef.current.value = "";
    if (libraryRef.current) libraryRef.current.value = "";
  }

  // ── Before the device-level switch is known (server render + first paint) ─
  if (allowed === null) {
    return <div className="card !rounded-3xl h-64 animate-pulse" aria-hidden />;
  }

  // ── One-time disclaimer, blocking, explicit affirmative action ───────────
  // Sits ahead of the device switch on purpose: the compliance gate is the
  // thing a first-time member must pass, not a privacy preference.
  if (!consented) {
    return <AiGradingConsentGate onAccepted={() => setConsented(true)} />;
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
              estimate of how inflamed it looks — worked out on your device — to help you
              describe the flare to a clinician.
            </p>
            <AiEstimateLabel className="mt-3" />

            <div className="mt-5 w-full max-w-xs">
              <label className="label">Which area? (optional)</label>
              <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Not specified</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                Picking the area lets us compare against your own photo of the same place from a
                day you rated calm, so skin tone and lighting cancel out.
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
            {estimate?.regionMap ? (
              <FlareRegionMap src={preview} regionMap={estimate.regionMap} />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={preview}
                alt="The photo being graded"
                className="h-40 w-40 shrink-0 rounded-2xl object-cover"
              />
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              {working ? (
                <p className="flex items-center justify-center gap-2 text-sm text-slate-400 sm:justify-start">
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading the photo on your device…
                </p>
              ) : rejected === "too-dark" ? (
                <>
                  <p className="font-semibold text-white">Too dark or too bright to grade</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Most of this photo is deep shadow or blown-out highlight. Try again in even,
                    natural light — daylight near a window works best.
                  </p>
                </>
              ) : rejected === "too-little-skin" ? (
                <>
                  <p className="font-semibold text-white">Couldn&apos;t find enough skin</p>
                  <p className="mt-1 text-sm text-slate-400">{NON_SKIN_MESSAGE}</p>
                </>
              ) : estimate && band ? (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                  <ScoreRing score={estimate.score} tone={band.tone} />
                  <div>
                    {/* Non-dismissible: sits above the number, always. */}
                    <AiEstimateLabel size="sm" />
                    <p className={cn("mt-1.5 text-lg font-bold", TONE_TEXT[band.tone])}>
                      {band.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{band.blurb}</p>
                    {/* The range, not just the point. A member comparing 53
                        against last week's 58 is otherwise reading noise as
                        improvement. */}
                    {estimate.low != null && estimate.high != null && (
                      <p className="mt-1 text-sm text-slate-400">
                        Realistically somewhere in{" "}
                        <span className="font-semibold tabular-nums text-slate-300">
                          {estimate.low}–{estimate.high}
                        </span>
                        .
                      </p>
                    )}
                    {previous && (
                      <TrendLine
                        score={estimate.score}
                        previous={previous}
                        margin={
                          estimate.low != null && estimate.high != null
                            ? Math.round((estimate.high - estimate.low) / 2)
                            : 5
                        }
                      />
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      {estimate.basis === "baseline"
                        ? "Scored against your own photo from a day you rated calm."
                        : `Absolute scale — save a photo on a day you rate ${CALM_MANUAL_SEVERITY}/10 or lower and it starts comparing against that instead.`}
                      {area ? ` · ${anyZoneLabel(area)}` : ""}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* What the PHOTO couldn't support. Sits next to the number
                  rather than buried in the detail panel, because a member who
                  only reads one thing should read the caveat with the score. */}
              {estimate?.qualityFlags?.length ? (
                <div className="mt-3 rounded-2xl border border-gold-500/25 bg-gold-500/5 p-3 text-left">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-200">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    What could be throwing this off
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {estimate.qualityFlags.map((flag) => (
                      <li key={flag} className="text-xs leading-relaxed text-slate-400">
                        {QUALITY_FLAG_COPY[flag]}
                      </li>
                    ))}
                  </ul>
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
              <span className="text-slate-400">Skin reading as inflamed</span>
              <span className="font-semibold tabular-nums text-slate-200">
                {Math.round(estimate.inflamedFraction * 100)}%
              </span>
            </li>
            <li className="flex items-center justify-between border-b border-lab-border py-2 text-sm">
              <span className="text-slate-400">Redness of the worst of it</span>
              <span className="font-semibold tabular-nums text-slate-200">
                {Math.round(estimate.rednessIndex * 100) / 100}
              </span>
            </li>
            {estimate.erythemaContrast != null && (
              <li className="flex items-center justify-between border-b border-lab-border py-2 text-sm">
                <span className="text-slate-400">Stands out from your calm skin by</span>
                <span className="font-semibold tabular-nums text-slate-200">
                  {Math.round(estimate.erythemaContrast * 100) / 100}
                </span>
              </li>
            )}
            {estimate.textureIndex != null && (
              <li className="flex items-center justify-between border-b border-lab-border py-2 text-sm">
                <span className="text-slate-400">Surface roughness</span>
                <span className="font-semibold text-slate-200">
                  {estimate.textureIndex < 0.025
                    ? "Smooth"
                    : estimate.textureIndex < 0.06
                      ? "Some texture"
                      : "Broken or scaly"}
                </span>
              </li>
            )}
            <li className="flex items-center justify-between border-b border-lab-border py-2 text-sm">
              <span className="text-slate-400">Scale</span>
              <span className="font-semibold text-slate-200">
                {estimate.basis === "baseline" ? "Your calm baseline" : "Absolute"}
              </span>
            </li>
            {estimate.confidence && (
              <li className="flex items-center justify-between gap-4 border-b border-lab-border py-2 text-sm">
                <span className="shrink-0 text-slate-400">Confidence in this photo</span>
                <span className="text-right font-semibold text-slate-200">
                  {confidenceLabel(estimate.confidence)}
                </span>
              </li>
            )}
            <li className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-400">Method</span>
              <span className="font-semibold text-slate-200">{methodLabel(estimate.method)}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            All of this is computed in your browser. It measures the worst of the patch against
            your own quieter skin in the same photo — not an average of everything in frame, so
            a small raw patch on an otherwise clear arm still registers. Hair, deep shadow,
            bedding and clothing are dropped before anything is measured, and surface roughness
            is read alongside colour so scaly and broken skin isn&apos;t scored as though it were
            smooth. Nothing is uploaded unless you choose to save it to your timeline.
          </p>

          <button
            onClick={() => setShowAbout((v) => !v)}
            className="mt-3 text-xs font-medium text-brand-300 hover:text-brand-200"
          >
            {showAbout ? "Hide details" : "About this estimate →"}
          </button>
          {showAbout && (
            <div className="mt-3">
              <AboutThisEstimate
                modelId={estimate.modelId ?? null}
                method={methodLabel(estimate.method)}
                consentVersion={estimate.consentVersion ?? null}
              />
            </div>
          )}
        </div>
      )}

      {/* The number, broken back into what a clinician actually asks about */}
      {estimate && readout && (
        <div className="card !rounded-3xl">
          <h2 className="font-semibold text-white">Describing this to a clinician</h2>
          <p className="mt-1 text-sm text-slate-400">
            &ldquo;{estimate.score}/100&rdquo; means nothing in an appointment. These are the
            same headings the EASI uses, so you can read them straight out.
          </p>

          <ul className="mt-4 space-y-2">
            <ReadoutRow
              label="Redness"
              hint="Erythema"
              value={`${EASI_SIGN_BANDS[readout.erythema].label} (${readout.erythema}/3)`}
            />
            <ReadoutRow
              label="Broken skin, scale or crusting"
              hint="A photo can't tell scratch marks from scale, so this is one number"
              value={`${EASI_SIGN_BANDS[readout.surfaceDamage].label} (${readout.surfaceDamage}/3)`}
            />
            <ReadoutRow
              label="How much of the skin in this photo"
              hint={`Roughly the EASI area band ${readout.areaBand} — ${EASI_AREA_BANDS[readout.areaBand].label} — but only if this photo covers the whole body region`}
              value={`${readout.areaPercentOfPhoto}%`}
            />
          </ul>

          {/* Named rather than silently omitted: a reader who sees three signs
              filled in would reasonably assume the other two were checked. */}
          <p className="mt-3 rounded-2xl border border-lab-border bg-lab-bg/60 p-3 text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">Swelling and thickening aren&apos;t
            here on purpose.</span>{" "}
            The EASI also scores oedema/papulation and lichenification, and neither can be read
            from a flat photograph — they need to be seen or felt in three dimensions. Fill those
            two in yourself.
          </p>

          <Link href="/easi" className="btn-secondary mt-3">
            Open the EASI calculator
          </Link>
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
        An estimate to help you describe your flare to a clinician — not a diagnosis, and no
        substitute for one. It reads colour, so it can be thrown off by lighting, makeup,
        moisturiser shine and camera white balance, and it is far less reliable on deeper skin
        tones, where inflammation shows as violet or grey-brown rather than red. Your own rating
        in the daily tracker stays the real record.
      </p>
    </div>
  );
}
