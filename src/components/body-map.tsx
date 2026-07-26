"use client";

import { BODY_ZONES, type BodyZone } from "@/lib/tsw";
import { cn } from "@/lib/utils";

/** Tappable front-view human body map for the daily tracker.
 *
 * A single smooth human silhouette is drawn as the backdrop (one seamless
 * figure, never a pile of blocks). Tappable zones are invisible hit-areas
 * layered on top and CLIPPED to the body outline, so a selected zone lights up
 * in the exact shape of that body part and never spills outside the figure.
 *
 * One figure serves every condition: face-centric ones (acne, rosacea) tap the
 * facial sub-regions on the head; the rest use the whole scalp/face and the body
 * zones. Only the current condition's zones are interactive; the chip row below
 * is the accessible fallback for every zone. */

type Shape =
  | { t: "path"; d: string }
  | { t: "circle"; cx: number; cy: number; r: number }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number };

// The seamless silhouette (viewBox 240×480) — head, neck, torso, arms with
// rounded hands, legs with rounded feet. Used for both the backdrop fill and the
// clip path.
const SILHOUETTE: Shape[] = [
  { t: "ellipse", cx: 120, cy: 52, rx: 30, ry: 34 },
  { t: "path", d: "M108,78 L132,78 L132,112 L108,112 Z" },
  { t: "path", d: "M120,104 C90,104 73,116 70,140 C66,163 69,210 78,238 C84,258 103,264 120,264 C137,264 156,258 162,238 C171,210 174,163 170,140 C167,116 150,104 120,104 Z" },
  { t: "path", d: "M79,130 C64,154 55,206 53,256 C52,268 64,272 70,263 C75,210 86,158 93,136 C91,125 83,123 79,130 Z" },
  { t: "path", d: "M161,130 C176,154 185,206 187,256 C188,268 176,272 170,263 C165,210 154,158 147,136 C149,125 157,123 161,130 Z" },
  { t: "path", d: "M84,252 C81,312 89,372 91,416 C92,441 92,456 90,462 C96,466 107,466 111,462 C110,456 111,441 111,416 C113,372 118,312 117,252 Z" },
  { t: "path", d: "M156,252 C159,312 151,372 149,416 C148,441 148,456 150,462 C144,466 133,466 129,462 C130,456 129,441 129,416 C127,372 122,312 123,252 Z" },
];

// Region hit-areas, painted back-to-front (bigger parts first so the small
// highlights on top stay clickable). Everything is clipped to the silhouette.
const LEFT_ARM = "M79,130 C64,154 55,206 53,256 C52,268 64,272 70,263 C75,210 86,158 93,136 C91,125 83,123 79,130 Z";
const RIGHT_ARM = "M161,130 C176,154 185,206 187,256 C188,268 176,272 170,263 C165,210 154,158 147,136 C149,125 157,123 161,130 Z";
const LEFT_LEG = "M84,252 C81,312 89,372 91,416 C92,441 92,456 90,462 C96,466 107,466 111,462 C110,456 111,441 111,416 C113,372 118,312 117,252 Z";
const RIGHT_LEG = "M156,252 C159,312 151,372 149,416 C148,441 148,456 150,462 C144,466 133,466 129,462 C130,456 129,441 129,416 C127,372 122,312 123,252 Z";

const REGIONS: { zone: string; shapes: Shape[] }[] = [
  { zone: "chest", shapes: [{ t: "path", d: "M120,104 C90,104 73,116 70,140 C67,158 68,175 71,188 L169,188 C172,175 173,158 170,140 C167,116 150,104 120,104 Z" }] },
  { zone: "stomach", shapes: [{ t: "path", d: "M71,188 L169,188 C172,205 173,222 162,238 C156,258 137,264 120,264 C103,264 84,258 78,238 C67,222 68,205 71,188 Z" }] },
  { zone: "arms", shapes: [{ t: "path", d: LEFT_ARM }, { t: "path", d: RIGHT_ARM }] },
  { zone: "legs", shapes: [{ t: "path", d: LEFT_LEG }, { t: "path", d: RIGHT_LEG }] },
  // Head — whole-head zones (TSW / eczema / psoriasis)
  { zone: "scalp", shapes: [{ t: "ellipse", cx: 120, cy: 38, rx: 29, ry: 22 }] },
  { zone: "face", shapes: [{ t: "ellipse", cx: 120, cy: 66, rx: 29, ry: 22 }] },
  { zone: "neck", shapes: [{ t: "path", d: "M106,84 L134,84 L134,113 L106,113 Z" }] },
  { zone: "shoulders", shapes: [
    { t: "ellipse", cx: 84, cy: 118, rx: 22, ry: 16 }, { t: "ellipse", cx: 156, cy: 118, rx: 22, ry: 16 },
  ] },
  // Head — facial sub-regions (acne / rosacea)
  { zone: "forehead", shapes: [{ t: "ellipse", cx: 120, cy: 40, rx: 23, ry: 12 }] },
  { zone: "cheeks", shapes: [
    { t: "ellipse", cx: 103, cy: 58, rx: 11, ry: 12 }, { t: "ellipse", cx: 137, cy: 58, rx: 11, ry: 12 },
  ] },
  { zone: "nose", shapes: [{ t: "ellipse", cx: 120, cy: 56, rx: 6, ry: 14 }] },
  { zone: "jawline", shapes: [
    { t: "ellipse", cx: 98, cy: 72, rx: 9, ry: 13 }, { t: "ellipse", cx: 142, cy: 72, rx: 9, ry: 13 },
  ] },
  { zone: "chin", shapes: [{ t: "ellipse", cx: 120, cy: 79, rx: 14, ry: 9 }] },
  // Limb detail
  { zone: "elbow-creases", shapes: [
    { t: "circle", cx: 63, cy: 198, r: 12 }, { t: "circle", cx: 177, cy: 198, r: 12 },
  ] },
  { zone: "hands", shapes: [
    { t: "circle", cx: 62, cy: 258, r: 15 }, { t: "circle", cx: 178, cy: 258, r: 15 },
  ] },
  { zone: "knee-creases", shapes: [
    { t: "circle", cx: 101, cy: 362, r: 13 }, { t: "circle", cx: 139, cy: 362, r: 13 },
  ] },
  { zone: "feet", shapes: [
    { t: "circle", cx: 100, cy: 456, r: 16 }, { t: "circle", cx: 140, cy: 456, r: 16 },
  ] },
];

function renderShapes(shapes: Shape[], className: string): React.ReactNode {
  return shapes.map((s, i) => {
    if (s.t === "path") return <path key={i} d={s.d} className={className} />;
    if (s.t === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} className={className} />;
    return <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} className={className} />;
  });
}

const CLIP_ID = "bodymap-silhouette-clip";

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

  const interactive = REGIONS.filter((r) => zoneIds.has(r.zone));

  return (
    <div>
      <svg
        viewBox="0 0 240 480"
        className="mx-auto h-80 w-auto select-none"
        role="group"
        aria-label="Body map — tap the areas that are affected today"
      >
        <defs>
          <clipPath id={CLIP_ID}>{renderShapes(SILHOUETTE, "")}</clipPath>
        </defs>

        {/* Backdrop: one seamless human silhouette. */}
        <g className="fill-[#242433] [pointer-events:none]">{renderShapes(SILHOUETTE, "fill-[#242433]")}</g>

        {/* Interactive highlights, clipped to the body so they take its shape. */}
        <g clipPath={`url(#${CLIP_ID})`}>
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
                    "transition-colors [pointer-events:all]",
                    on
                      ? "fill-brand-500/80"
                      : "fill-transparent hover:fill-brand-500/25 focus-visible:fill-brand-500/30"
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
