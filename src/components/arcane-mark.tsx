import {
  MARK_VIEWBOX,
  PULSE_OPACITY,
  PULSE_POINTS,
  PULSE_STROKE,
  SIGIL_PATH,
} from "@/lib/mark.mjs";

/** The Arcane mark: the sigil with the tracker pulse line under it. Draws in
 * `currentColor`, so the caller sets the colour (white on the brand tile in
 * <Logo />). Geometry is shared with the app icons — see src/lib/mark.mjs. */
export function ArcaneMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={SIGIL_PATH.join(" ")}
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <polyline
        points={PULSE_POINTS.map(([x, y]) => `${x},${y}`).join(" ")}
        stroke="currentColor"
        strokeWidth={PULSE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={PULSE_OPACITY}
      />
    </svg>
  );
}
