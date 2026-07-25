"use client";

import { BODY_ZONES, type BodyZone } from "@/lib/tsw";
import { cn } from "@/lib/utils";

/** Tappable front-view body map.
 *
 * A solid human silhouette is always drawn as the backdrop (so the map never
 * looks broken or empty, whatever condition is selected), with anatomically
 * shaped, tappable regions layered on top. Zones the silhouette can't show
 * (e.g. "Back", or condition-specific face zones) live in the chip row
 * underneath, which is also the accessible fallback for every zone. */

// Anatomical region geometry, in a 240×440 viewBox (front-facing figure).
// Each region renders identically in the faint backdrop and the interactive
// layer, so the parts always line up into one body.
const REGION_PATHS: Record<string, string[]> = {
  scalp: ["M96,42 A26,28 0 0 1 144,42 Z"],
  face: ["M96,42 A26,30 0 0 0 144,42 Z"],
  neck: ["M112,72 L128,72 L127,88 L113,88 Z"],
  chest: [
    "M113,86 L127,86 C145,88 163,95 168,110 L164,150 L76,150 L72,110 C77,95 95,88 113,86 Z",
  ],
  stomach: [
    "M76,150 L164,150 L158,196 C156,214 144,224 120,224 C96,224 84,214 82,196 Z",
  ],
  arms: [
    "M72,110 C66,142 60,182 56,232 L70,232 C74,184 80,146 84,120 Z",
    "M168,110 C174,142 180,182 184,232 L170,232 C166,184 160,146 156,120 Z",
  ],
  legs: [
    "M84,222 C86,270 96,300 98,316 C100,360 100,384 99,406 L113,406 C114,384 116,360 116,316 C118,300 120,262 118,222 Z",
    "M156,222 C154,270 144,300 142,316 C140,360 140,384 141,406 L127,406 C126,384 124,360 124,316 C122,300 120,262 122,222 Z",
  ],
};

// Small round highlights (creases, hands, feet) drawn as circles.
const REGION_DOTS: Record<string, { cx: number; cy: number; r: number }[]> = {
  "elbow-creases": [
    { cx: 66, cy: 176, r: 8 },
    { cx: 174, cy: 176, r: 8 },
  ],
  hands: [
    { cx: 62, cy: 247, r: 12 },
    { cx: 178, cy: 247, r: 12 },
  ],
  "knee-creases": [
    { cx: 107, cy: 318, r: 9 },
    { cx: 133, cy: 318, r: 9 },
  ],
  feet: [
    { cx: 105, cy: 418, r: 12 },
    { cx: 135, cy: 418, r: 12 },
  ],
};

/** Every zone the silhouette can draw, in back-to-front paint order. */
const DRAW_ORDER = [
  "chest",
  "stomach",
  "arms",
  "legs",
  "neck",
  "face",
  "scalp",
  "elbow-creases",
  "hands",
  "knee-creases",
  "feet",
];

/** Render a zone's shapes with a given className (used for both the backdrop
 * and the interactive layer). */
function zoneShapes(zone: string, className: string): React.ReactNode {
  const paths = REGION_PATHS[zone];
  if (paths) {
    return paths.map((d, i) => <path key={i} d={d} className={className} />);
  }
  const dots = REGION_DOTS[zone];
  if (dots) {
    return dots.map((c, i) => (
      <circle key={i} cx={c.cx} cy={c.cy} r={c.r} className={className} />
    ));
  }
  return null;
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

  // Interactive zones = those the current condition uses AND the silhouette can
  // draw. Everything else is handled by the chip row below.
  const interactiveZones = DRAW_ORDER.filter(
    (z) => zoneIds.has(z) && (REGION_PATHS[z] || REGION_DOTS[z])
  );

  return (
    <div>
      <svg
        viewBox="0 0 240 440"
        className="mx-auto h-80 w-auto select-none"
        role="group"
        aria-label="Body map — tap the areas that are affected today"
      >
        {/* Backdrop: the full human silhouette, always visible so the map reads
            as a body even before anything is tapped. */}
        <g className="fill-[#20202e] stroke-none">
          {DRAW_ORDER.map((zone) => (
            <g key={`bg-${zone}`}>{zoneShapes(zone, "fill-[#20202e]")}</g>
          ))}
        </g>

        {/* Interactive layer: highlights on hover/selection. */}
        <g strokeWidth={1.75}>
          {interactiveZones.map((zone) => {
            const on = set.has(zone);
            return (
              <g
                key={zone}
                role="checkbox"
                aria-checked={on}
                aria-label={label(zone)}
                tabIndex={0}
                onClick={() => onToggle(zone)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle(zone);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                <title>{label(zone)}</title>
                {zoneShapes(
                  zone,
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
