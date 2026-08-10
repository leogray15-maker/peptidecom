import { REGION_GRID } from "@/lib/photo-score";
import { cn } from "@/lib/utils";

/**
 * The photo with a coarse heat overlay showing which parts of it drove the
 * estimate.
 *
 * This exists because "68/100" is not something a member can check. Showing
 * where the reading came from makes the estimate falsifiable by eye: if the
 * hot tiles are sitting on a red jumper or a shadow rather than on the patch,
 * they can see that instantly and reshoot, which no confidence score can do
 * for them.
 *
 * Only tiles above the "clearly involved" level are tinted. Tinting everything
 * would paint a wash over normal skin and read as a claim about it.
 */
export function FlareRegionMap({
  src,
  regionMap,
  className,
}: {
  src: string;
  /** Row-major REGION_GRID × REGION_GRID composites, null where unmeasured. */
  regionMap: (number | null)[];
  className?: string;
}) {
  const anyHot = regionMap.some((c) => c != null && c >= TINT_FLOOR);

  return (
    <figure className={cn("shrink-0", className)}>
      <div className="relative h-40 w-40 overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="The photo being graded" className="h-full w-full object-cover" />
        {anyHot && (
          <div
            className="pointer-events-none absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${REGION_GRID}, 1fr)`,
              gridTemplateRows: `repeat(${REGION_GRID}, 1fr)`,
            }}
            aria-hidden
          >
            {regionMap.map((composite, i) => (
              <span key={i} className={tintFor(composite)} />
            ))}
          </div>
        )}
      </div>
      <figcaption className="mt-1.5 text-center text-[10px] leading-snug text-slate-500">
        {anyHot
          ? "Shaded where it read inflammation"
          : "No single area stood out in this photo"}
      </figcaption>
    </figure>
  );
}

/** Below this a tile is ordinary skin and gets no tint at all. */
const TINT_FLOOR = 0.3;

function tintFor(composite: number | null): string {
  if (composite == null || composite < TINT_FLOOR) return "";
  if (composite < 0.5) return "bg-amber-400/20";
  if (composite < 0.7) return "bg-orange-500/25";
  return "bg-rose-500/30";
}
