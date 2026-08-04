// The Arcane brand mark: the arcane sigil above a subtle pulse line.
//
// Single source of truth for the geometry — imported by
// src/components/arcane-mark.tsx (renders it as SVG in the app) and by
// scripts/generate-icons.mjs (rasterises it into the PNG app icons). Keeping
// the coordinates here means the home-screen icon and the in-app logo can
// never drift apart.
//
// Plain .mjs rather than .ts so the dependency-free icon script can `import`
// it directly under plain Node.

/** Both the sigil paths and the pulse points live in this square viewBox. */
export const MARK_VIEWBOX = 128;

/** The sigil: an arrowhead with a sharp apex, an inner kite void, two wing
 * voids and a swallow-tail bottom. Four subpaths — the outer silhouette plus
 * three holes — so it must be filled with the even-odd rule. */
export const SIGIL_PATH = [
  // Outer silhouette: apex, right corner, curved sweep to the bottom point,
  // mirrored sweep back out to the left corner.
  "M 64 8 L 104 80.2 C 93 80.8 76 84 70 87 C 68 88 66 89.6 64 92 C 62 89.6 60 88 58 87 C 52 84 35 80.8 24 80.2 Z",
  // Inner kite, hanging from the apex.
  "M 64 21.7 L 78 48.4 Q 71.5 50 64 55.6 Q 56.5 50 50 48.4 Z",
  // Right wing, cut away below the kite. Its base tracks the outer sweep
  // rather than sitting flat, so the band along the tail stays even.
  "M 66 61.4 Q 74 57.5 81.4 54.5 L 90.4 72.4 Q 78.6 75.2 67.4 76.2 Z",
  // Left wing.
  "M 62 61.4 Q 54 57.5 46.6 54.5 L 37.6 72.4 Q 49.4 75.2 60.6 76.2 Z",
];

/** The pulse line beneath the sigil — the health/skin tracker half of the
 * mark. Kept short, shallow and thin so it reads as a footnote to the sigil
 * rather than competing with it. */
export const PULSE_POINTS = [
  [36, 108],
  [52, 108],
  [59, 99],
  [71, 117],
  [78, 108],
  [92, 108],
];

/** Stroke width of the pulse, in viewBox units. Round caps and joins. */
export const PULSE_STROKE = 3.8;

/** The pulse is drawn at less than full white so it stays subordinate to the
 * sigil at icon sizes. */
export const PULSE_OPACITY = 0.72;
