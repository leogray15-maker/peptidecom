"use client";

import { BODY_ZONES, type BodyZone } from "@/lib/tsw";
import { cn } from "@/lib/utils";

/** Tappable front-view human body map for the daily tracker.
 *
 * One full-body figure serves every condition. A solid silhouette is always
 * drawn as the backdrop (so the map never looks broken or empty), with
 * anatomically placed, tappable regions layered on top — including facial
 * sub-regions on the head (forehead, cheeks, nose, chin, jawline) for
 * face-centric conditions like acne and rosacea. Only the zones the current
 * condition uses become interactive; the rest still contribute to the
 * silhouette. Every zone also appears in the chip row underneath, which is the
 * accessible fallback. */

type Shape =
  | { t: "path"; d: string }
  | { t: "circle"; cx: number; cy: number; r: number }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number };

// Geometry in a 240×472 viewBox (front-facing figure, slightly enlarged head so
// the facial regions are comfortably tappable). Painted back-to-front.
const REGIONS: { zone: string; shapes: Shape[] }[] = [
  { zone: "chest", shapes: [{ t: "path", d: "M111,108 L129,108 C149,110 167,118 173,133 L169,178 L71,178 L67,133 C73,118 91,110 111,108 Z" }] },
  { zone: "stomach", shapes: [{ t: "path", d: "M71,178 L169,178 L163,226 C161,244 149,254 120,254 C91,254 79,244 77,226 Z" }] },
  { zone: "arms", shapes: [
    { t: "path", d: "M67,133 C61,168 55,210 51,260 L65,260 C69,212 75,170 79,143 Z" },
    { t: "path", d: "M173,133 C179,168 185,210 189,260 L175,260 C171,212 165,170 161,143 Z" },
  ] },
  { zone: "legs", shapes: [
    { t: "path", d: "M79,252 C81,302 91,338 93,354 C95,400 95,426 94,450 L110,450 C111,426 113,400 113,354 C115,338 117,302 115,252 Z" },
    { t: "path", d: "M161,252 C159,302 149,338 147,354 C145,400 145,426 146,450 L130,450 C129,426 127,400 127,354 C125,338 123,302 125,252 Z" },
  ] },
  // Head — whole-head zones (TSW / eczema / psoriasis)
  { zone: "scalp", shapes: [{ t: "path", d: "M91,44 A31,32 0 0 1 149,44 Z" }] },
  { zone: "face", shapes: [{ t: "path", d: "M91,44 A31,40 0 0 0 149,44 Z" }] },
  { zone: "neck", shapes: [{ t: "path", d: "M110,92 L130,92 L129,110 L111,110 Z" }] },
  { zone: "shoulders", shapes: [
    { t: "ellipse", cx: 80, cy: 126, rx: 18, ry: 13 },
    { t: "ellipse", cx: 160, cy: 126, rx: 18, ry: 13 },
  ] },
  // Head — facial sub-regions (acne / rosacea)
  { zone: "forehead", shapes: [{ t: "ellipse", cx: 120, cy: 36, rx: 23, ry: 11 }] },
  { zone: "cheeks", shapes: [
    { t: "ellipse", cx: 101, cy: 62, rx: 11, ry: 13 },
    { t: "ellipse", cx: 139, cy: 62, rx: 11, ry: 13 },
  ] },
  { zone: "nose", shapes: [{ t: "ellipse", cx: 120, cy: 60, rx: 6, ry: 14 }] },
  { zone: "jawline", shapes: [
    { t: "ellipse", cx: 95, cy: 78, rx: 8, ry: 13 },
    { t: "ellipse", cx: 145, cy: 78, rx: 8, ry: 13 },
  ] },
  { zone: "chin", shapes: [{ t: "ellipse", cx: 120, cy: 88, rx: 14, ry: 8 }] },
  // Limb detail
  { zone: "elbow-creases", shapes: [
    { t: "circle", cx: 61, cy: 202, r: 8 }, { t: "circle", cx: 179, cy: 202, r: 8 },
  ] },
  { zone: "hands", shapes: [
    { t: "circle", cx: 57, cy: 274, r: 12 }, { t: "circle", cx: 183, cy: 274, r: 12 },
  ] },
  { zone: "knee-creases", shapes: [
    { t: "circle", cx: 104, cy: 354, r: 9 }, { t: "circle", cx: 136, cy: 354, r: 9 },
  ] },
  { zone: "feet", shapes: [
    { t: "circle", cx: 101, cy: 460, r: 12 }, { t: "circle", cx: 139, cy: 460, r: 12 },
  ] },
];

function renderShapes(shapes: Shape[], className: string): React.ReactNode {
  return shapes.map((s, i) => {
    if (s.t === "path") return <path key={i} d={s.d} className={className} />;
    if (s.t === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} className={className} />;
    return <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} className={className} />;
  });
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

  const interactive = REGIONS.filter((r) => zoneIds.has(r.zone));

  return (
    <div>
      <svg
        viewBox="0 0 240 472"
        className="mx-auto h-80 w-auto select-none"
        role="group"
        aria-label="Body map — tap the areas that are affected today"
      >
        {/* Backdrop: the full human silhouette, always drawn. */}
        <g className="fill-[#20202e] [pointer-events:none]">
          {REGIONS.map((r) => (
            <g key={`bg-${r.zone}`}>{renderShapes(r.shapes, "fill-[#20202e]")}</g>
          ))}
        </g>

        {/* Interactive layer. pointer-events:all so transparent regions are
            still clickable. */}
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
                    "transition-colors [pointer-events:all]",
                    on
                      ? "fill-brand-500/75 stroke-brand-300"
                      : "fill-white/[0.04] stroke-transparent hover:fill-brand-500/30 focus-visible:fill-brand-500/30"
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
