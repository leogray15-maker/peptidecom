"use client";

import { BODY_ZONES, type BodyZone } from "@/lib/tsw";
import { cn } from "@/lib/utils";

/** Tappable body map for the daily tracker.
 *
 * Every condition gets the same full front-facing human figure — a face-only
 * diagram made face-centric conditions feel like a different (smaller) app, and
 * skin rarely stays in one place anyway.
 *
 * Conditions that track facial regions (acne, rosacea) additionally get a
 * magnified head inset beside the figure, because forehead/cheeks/nose/chin are
 * far too small to tap accurately on the body itself.
 *
 * A solid silhouette is always drawn as the backdrop, so the map reads as a
 * whole body even when only a few regions are tappable for this condition.
 * Zones the drawings can't show (e.g. Back, on a front view) still live in the
 * chip row underneath, which is also the accessible fallback for every zone. */

type Shape =
  | { t: "path"; d: string }
  | { t: "circle"; cx: number; cy: number; r: number }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number };

interface Diagram {
  viewBox: string;
  /** Rendered height — the body is the hero, the head inset supports it. */
  heightClass: string;
  /** Non-interactive structural fill (drawn first, never tappable). */
  structure: Shape[];
  /** Tappable regions by zone id, painted back-to-front. */
  regions: { zone: string; shapes: Shape[] }[];
}

// ── Full body — shown for every condition ───────────────────────────────────
//
// Drawn to roughly human proportions (~7.5 heads tall) on a 240×530 canvas, so
// the figure reads as a person rather than a diagram. Facial sub-regions are
// deliberately NOT on this figure — at this scale they cover the whole head and
// make it look broken; they live on the head inset instead.
const BODY: Diagram = {
  viewBox: "0 0 240 530",
  heightClass: "h-72 sm:h-80",
  structure: [],
  regions: [
    { zone: "chest", shapes: [{ t: "path", d: "M108,90 L132,90 C148,92 162,100 165,112 L161,178 L79,178 L75,112 C78,100 92,92 108,90 Z" }] },
    { zone: "stomach", shapes: [{ t: "path", d: "M79,178 L161,178 L156,214 C170,228 172,246 168,262 L72,262 C68,246 70,228 84,214 Z" }] },
    { zone: "arms", shapes: [
      { t: "path", d: "M75,110 C66,120 62,150 58,190 C55,220 52,240 50,252 L64,254 C67,240 70,220 73,190 C77,150 82,124 89,116 Z" },
      { t: "path", d: "M165,110 C174,120 178,150 182,190 C185,220 188,240 190,252 L176,254 C173,240 170,220 167,190 C163,150 158,124 151,116 Z" },
    ] },
    { zone: "legs", shapes: [
      { t: "path", d: "M72,262 C74,320 80,360 84,410 C86,450 86,480 86,496 L110,496 C110,478 111,448 112,410 C114,360 116,320 118,262 Z" },
      { t: "path", d: "M168,262 C166,320 160,360 156,410 C154,450 154,480 154,496 L130,496 C130,478 129,448 128,410 C126,360 124,320 122,262 Z" },
    ] },
    { zone: "shoulders", shapes: [
      { t: "ellipse", cx: 88, cy: 106, rx: 18, ry: 12 },
      { t: "ellipse", cx: 152, cy: 106, rx: 18, ry: 12 },
    ] },
    { zone: "neck", shapes: [{ t: "path", d: "M108,70 L132,70 L132,94 L108,94 Z" }] },
    { zone: "face", shapes: [{ t: "path", d: "M94,44 A26,32 0 0 0 146,44 Z" }] },
    { zone: "scalp", shapes: [{ t: "path", d: "M94,44 A26,32 0 0 1 146,44 Z" }] },
    { zone: "elbow-creases", shapes: [
      { t: "circle", cx: 70, cy: 186, r: 9 }, { t: "circle", cx: 170, cy: 186, r: 9 },
    ] },
    { zone: "hands", shapes: [
      { t: "ellipse", cx: 57, cy: 268, rx: 11, ry: 15 },
      { t: "ellipse", cx: 183, cy: 268, rx: 11, ry: 15 },
    ] },
    { zone: "knee-creases", shapes: [
      { t: "circle", cx: 98, cy: 372, r: 10 }, { t: "circle", cx: 142, cy: 372, r: 10 },
    ] },
    { zone: "feet", shapes: [
      { t: "ellipse", cx: 98, cy: 506, rx: 15, ry: 10 },
      { t: "ellipse", cx: 142, cy: 506, rx: 15, ry: 10 },
    ] },
  ],
};

/** Facial zones that are too small to tap on the body figure. */
const FACE_ZONE_IDS = ["forehead", "cheeks", "nose", "jawline", "chin"];

// ── Magnified head — only for conditions that track facial zones ────────────
const FACE_INSET: Diagram = {
  viewBox: "0 0 200 230",
  heightClass: "h-40 sm:h-52",
  structure: [
    { t: "ellipse", cx: 100, cy: 108, rx: 72, ry: 94 }, // head
    { t: "path", d: "M84,190 L116,190 L114,220 L86,220 Z" }, // neck stub
  ],
  // Regions are laid out so no two overlap — an overlap means one zone swallows
  // another's taps.
  regions: [
    { zone: "forehead", shapes: [{ t: "ellipse", cx: 100, cy: 52, rx: 46, ry: 20 }] },
    { zone: "nose", shapes: [{ t: "ellipse", cx: 100, cy: 110, rx: 9, ry: 24 }] },
    { zone: "cheeks", shapes: [
      { t: "ellipse", cx: 62, cy: 110, rx: 20, ry: 18 }, { t: "ellipse", cx: 138, cy: 110, rx: 20, ry: 18 },
    ] },
    { zone: "jawline", shapes: [
      { t: "ellipse", cx: 58, cy: 150, rx: 14, ry: 16 }, { t: "ellipse", cx: 142, cy: 150, rx: 14, ry: 16 },
    ] },
    { zone: "chin", shapes: [{ t: "ellipse", cx: 100, cy: 174, rx: 24, ry: 14 }] },
  ],
};

function renderShapes(shapes: Shape[], className: string): React.ReactNode {
  return shapes.map((s, i) => {
    if (s.t === "path") return <path key={i} d={s.d} className={className} />;
    if (s.t === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} className={className} />;
    return <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} className={className} />;
  });
}

function DiagramSvg({
  diagram,
  zoneIds,
  selected,
  onToggle,
  label,
  ariaLabel,
}: {
  diagram: Diagram;
  zoneIds: Set<string>;
  selected: Set<string>;
  onToggle: (zone: string) => void;
  label: (id: string) => string;
  ariaLabel: string;
}) {
  const interactive = diagram.regions.filter((r) => zoneIds.has(r.zone));

  return (
    <svg
      viewBox={diagram.viewBox}
      className={cn("w-auto shrink-0 select-none", diagram.heightClass)}
      role="group"
      aria-label={ariaLabel}
    >
      {/* Backdrop: solid silhouette so the figure always reads as a whole body. */}
      <g>
        {renderShapes(diagram.structure, "fill-[#20202e]")}
        {diagram.regions.map((r) => (
          <g key={`bg-${r.zone}`}>{renderShapes(r.shapes, "fill-[#20202e]")}</g>
        ))}
      </g>

      {/* Interactive layer */}
      <g strokeWidth={1.75}>
        {interactive.map((r) => {
          const on = selected.has(r.zone);
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
                    : // Touch devices get no hover, so tappable regions carry a
                      // faint tint of their own — otherwise they're invisible.
                      "fill-white/[0.05] stroke-white/15 hover:fill-brand-500/25 focus-visible:fill-brand-500/30"
                )
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
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
  const showFaceInset = FACE_ZONE_IDS.some((z) => zoneIds.has(z));

  return (
    <div>
      {/* Top-aligned so the magnified head sits level with the figure's own
          head and reads as a zoom of it. */}
      <div className="flex items-start justify-center gap-2 sm:gap-6">
        <DiagramSvg
          diagram={BODY}
          zoneIds={zoneIds}
          selected={set}
          onToggle={onToggle}
          label={label}
          ariaLabel="Body map — tap the areas that are affected today"
        />
        {showFaceInset && (
          <DiagramSvg
            diagram={FACE_INSET}
            zoneIds={zoneIds}
            selected={set}
            onToggle={onToggle}
            label={label}
            ariaLabel="Face map — tap the facial areas that are affected today"
          />
        )}
      </div>

      {/* Chip fallback — includes every zone the drawings can't show */}
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
