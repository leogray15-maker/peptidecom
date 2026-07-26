"use client";

import { BODY_ZONES, type BodyZone } from "@/lib/tsw";
import { cn } from "@/lib/utils";

/** Tappable body/face map for the daily tracker.
 *
 * Two silhouettes, chosen by the condition's zones:
 *  • Face-centric conditions (acne, rosacea) get a head-and-shoulders diagram
 *    with tappable facial regions (forehead, cheeks, nose, chin, jawline…).
 *  • Everything else gets a full front-facing human figure.
 *
 * A solid silhouette is always drawn as the backdrop so the map never looks
 * broken or empty, with anatomically placed, tappable regions layered on top.
 * Any zone the silhouette can't show still lives in the chip row underneath,
 * which is also the accessible fallback for every zone. */

type Shape =
  | { t: "path"; d: string }
  | { t: "circle"; cx: number; cy: number; r: number }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number };

interface Silhouette {
  viewBox: string;
  heightClass: string;
  /** Non-interactive structural fill (e.g. the head/neck/torso base). */
  structure: Shape[];
  /** Tappable regions by zone id, painted back-to-front. */
  regions: { zone: string; shapes: Shape[] }[];
}

// ── Full body (TSW / eczema / psoriasis) ─────────────────────────────────────
const BODY: Silhouette = {
  viewBox: "0 0 240 440",
  heightClass: "h-80",
  structure: [],
  regions: [
    { zone: "chest", shapes: [{ t: "path", d: "M113,86 L127,86 C145,88 163,95 168,110 L164,150 L76,150 L72,110 C77,95 95,88 113,86 Z" }] },
    { zone: "stomach", shapes: [{ t: "path", d: "M76,150 L164,150 L158,196 C156,214 144,224 120,224 C96,224 84,214 82,196 Z" }] },
    { zone: "arms", shapes: [
      { t: "path", d: "M72,110 C66,142 60,182 56,232 L70,232 C74,184 80,146 84,120 Z" },
      { t: "path", d: "M168,110 C174,142 180,182 184,232 L170,232 C166,184 160,146 156,120 Z" },
    ] },
    { zone: "legs", shapes: [
      { t: "path", d: "M84,222 C86,270 96,300 98,316 C100,360 100,384 99,406 L113,406 C114,384 116,360 116,316 C118,300 120,262 118,222 Z" },
      { t: "path", d: "M156,222 C154,270 144,300 142,316 C140,360 140,384 141,406 L127,406 C126,384 124,360 124,316 C122,300 120,262 122,222 Z" },
    ] },
    { zone: "neck", shapes: [{ t: "path", d: "M112,72 L128,72 L127,88 L113,88 Z" }] },
    { zone: "face", shapes: [{ t: "path", d: "M96,42 A26,30 0 0 0 144,42 Z" }] },
    { zone: "scalp", shapes: [{ t: "path", d: "M96,42 A26,28 0 0 1 144,42 Z" }] },
    { zone: "elbow-creases", shapes: [
      { t: "circle", cx: 66, cy: 176, r: 8 }, { t: "circle", cx: 174, cy: 176, r: 8 },
    ] },
    { zone: "hands", shapes: [
      { t: "circle", cx: 62, cy: 247, r: 12 }, { t: "circle", cx: 178, cy: 247, r: 12 },
    ] },
    { zone: "knee-creases", shapes: [
      { t: "circle", cx: 107, cy: 318, r: 9 }, { t: "circle", cx: 133, cy: 318, r: 9 },
    ] },
    { zone: "feet", shapes: [
      { t: "circle", cx: 105, cy: 418, r: 12 }, { t: "circle", cx: 135, cy: 418, r: 12 },
    ] },
  ],
};

// ── Head & shoulders (acne / rosacea — face-centric) ─────────────────────────
const FACE: Silhouette = {
  viewBox: "0 0 240 330",
  heightClass: "h-80",
  structure: [
    { t: "ellipse", cx: 120, cy: 112, rx: 76, ry: 96 }, // head
    { t: "path", d: "M106,196 L134,196 L132,226 L108,226 Z" }, // neck
    { t: "path", d: "M120,224 C68,226 38,250 32,312 L208,312 C202,250 172,226 120,224 Z" }, // shoulders/chest
  ],
  regions: [
    { zone: "forehead", shapes: [{ t: "ellipse", cx: 120, cy: 58, rx: 50, ry: 22 }] },
    { zone: "cheeks", shapes: [
      { t: "ellipse", cx: 82, cy: 132, rx: 24, ry: 22 }, { t: "ellipse", cx: 158, cy: 132, rx: 24, ry: 22 },
    ] },
    { zone: "nose", shapes: [{ t: "ellipse", cx: 120, cy: 116, rx: 10, ry: 27 }] },
    { zone: "jawline", shapes: [
      { t: "ellipse", cx: 60, cy: 160, rx: 14, ry: 28 }, { t: "ellipse", cx: 180, cy: 160, rx: 14, ry: 28 },
    ] },
    { zone: "chin", shapes: [{ t: "ellipse", cx: 120, cy: 178, rx: 26, ry: 15 }] },
    { zone: "neck", shapes: [{ t: "path", d: "M106,196 L134,196 L132,226 L108,226 Z" }] },
    { zone: "shoulders", shapes: [
      { t: "ellipse", cx: 58, cy: 262, rx: 30, ry: 22 }, { t: "ellipse", cx: 182, cy: 262, rx: 30, ry: 22 },
    ] },
    { zone: "chest", shapes: [{ t: "ellipse", cx: 120, cy: 286, rx: 46, ry: 24 }] },
  ],
};

function renderShapes(shapes: Shape[], className: string): React.ReactNode {
  return shapes.map((s, i) => {
    if (s.t === "path") return <path key={i} d={s.d} className={className} />;
    if (s.t === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} className={className} />;
    return <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} className={className} />;
  });
}

/** Face-centric conditions expose facial zones the full body can't show. */
function pickSilhouette(zoneIds: Set<string>): Silhouette {
  const faceCentric = ["forehead", "cheeks", "nose", "jawline"].some((z) => zoneIds.has(z));
  return faceCentric ? FACE : BODY;
}

export function BodyMap({
  selected,
  onToggle,
  zones = BODY_ZONES,
}: {
  selected: string[];
  onToggle: (zone: string) => void;
  zones?: BodyZone[];
}) {
  const set = new Set(selected);
  const zoneIds = new Set(zones.map((z) => z.id));
  const label = (id: string) => zones.find((z) => z.id === id)?.label ?? id;

  const silhouette = pickSilhouette(zoneIds);
  const interactive = silhouette.regions.filter((r) => zoneIds.has(r.zone));

  return (
    <div>
      <svg
        viewBox={silhouette.viewBox}
        className={cn("mx-auto w-auto select-none", silhouette.heightClass)}
        role="group"
        aria-label="Body map — tap the areas that are affected today"
      >
        {/* Backdrop: solid silhouette so the map always reads as a body/face. */}
        <g className="fill-[#20202e]">
          {renderShapes(silhouette.structure, "fill-[#20202e]")}
          {silhouette.regions.map((r) => (
            <g key={`bg-${r.zone}`}>{renderShapes(r.shapes, "fill-[#20202e]")}</g>
          ))}
        </g>

        {/* Interactive layer */}
        <g strokeWidth={1.75}>
          {interactive.map((r) => {
            const on = set.has(r.zone);
            return (
              <g
                key={r.zone}
                role="checkbox"
                aria-checked={on}
                aria-label={label(r.zone)}
                tabIndex={0}
                onClick={() => onToggle(r.zone)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle(r.zone);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                <title>{label(r.zone)}</title>
                {renderShapes(
                  r.shapes,
                  cn(
                    "transition-colors",
                    on
                      ? "fill-brand-500/75 stroke-brand-300"
                      : "fill-transparent stroke-transparent hover:fill-brand-500/25 focus-visible:fill-brand-500/30"
                  )
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Chip fallback — includes every zone the SVG can't show */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {zones.map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => onToggle(z.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              set.has(z.id)
                ? "border-brand-500 bg-brand-500/20 text-brand-200"
                : "border-lab-border text-slate-400 hover:border-brand-700 hover:text-slate-200"
            )}
          >
            {z.label}
          </button>
        ))}
      </div>
    </div>
  );
}
