"use client";

import { BODY_ZONES } from "@/lib/tsw";
import { cn } from "@/lib/utils";

/** Tappable front-view body map. Each zone is a rounded SVG shape; "Back" has
 * no front-view shape so it lives in the chip row underneath (which also acts
 * as the accessible fallback for every zone). */

interface Shape {
  zone: string;
  el: React.ReactNode;
}

function shapesFor(selected: Set<string>): Shape[] {
  const cls = (zone: string) =>
    cn(
      "cursor-pointer transition-colors",
      selected.has(zone)
        ? "fill-brand-500/70 stroke-brand-300"
        : "fill-[#1b1b28] stroke-[#2c2c3d] hover:fill-brand-900/70"
    );
  const sw = { strokeWidth: 1.5 } as const;

  return [
    // Head
    { zone: "scalp", el: <path d="M79 40 a21 21 0 0 1 42 0 z" className={cls("scalp")} {...sw} /> },
    { zone: "face", el: <path d="M79 42 h42 a21 23 0 0 1 -42 0 z" className={cls("face")} {...sw} /> },
    // Neck & torso
    { zone: "neck", el: <rect x={91} y={64} width={18} height={11} rx={4} className={cls("neck")} {...sw} /> },
    { zone: "chest", el: <rect x={70} y={77} width={60} height={33} rx={11} className={cls("chest")} {...sw} /> },
    { zone: "stomach", el: <rect x={73} y={112} width={54} height={28} rx={11} className={cls("stomach")} {...sw} /> },
    // Arms
    { zone: "arms", el: <g className={cls("arms")} {...sw}><rect x={44} y={80} width={19} height={78} rx={9} /><rect x={137} y={80} width={19} height={78} rx={9} /></g> },
    { zone: "elbow-creases", el: <g className={cls("elbow-creases")} {...sw}><circle cx={53.5} cy={119} r={7.5} /><circle cx={146.5} cy={119} r={7.5} /></g> },
    { zone: "hands", el: <g className={cls("hands")} {...sw}><ellipse cx={53.5} cy={171} rx={10} ry={12} /><ellipse cx={146.5} cy={171} rx={10} ry={12} /></g> },
    // Legs
    { zone: "legs", el: <g className={cls("legs")} {...sw}><rect x={76} y={142} width={22} height={106} rx={10} /><rect x={102} y={142} width={22} height={106} rx={10} /></g> },
    { zone: "knee-creases", el: <g className={cls("knee-creases")} {...sw}><circle cx={87} cy={198} r={7.5} /><circle cx={113} cy={198} r={7.5} /></g> },
    { zone: "feet", el: <g className={cls("feet")} {...sw}><ellipse cx={84} cy={260} rx={13} ry={9} /><ellipse cx={116} cy={260} rx={13} ry={9} /></g> },
  ];
}

export function BodyMap({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (zone: string) => void;
}) {
  const set = new Set(selected);
  return (
    <div>
      <svg
        viewBox="0 0 200 278"
        className="mx-auto h-72 w-auto select-none"
        role="group"
        aria-label="Body map — tap the areas that are affected today"
      >
        {shapesFor(set).map(({ zone, el }) => (
          <g
            key={zone}
            role="checkbox"
            aria-checked={set.has(zone)}
            aria-label={BODY_ZONES.find((z) => z.id === zone)?.label ?? zone}
            tabIndex={0}
            onClick={() => onToggle(zone)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle(zone);
              }
            }}
          >
            <title>{BODY_ZONES.find((z) => z.id === zone)?.label ?? zone}</title>
            {el}
          </g>
        ))}
      </svg>

      {/* Chip fallback — includes "Back", which the front view can't show */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {BODY_ZONES.map((z) => (
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
