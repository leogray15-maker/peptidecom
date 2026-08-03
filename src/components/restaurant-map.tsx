"use client";

// A small slippy map, built from scratch.
//
// The app carries no mapping library, and adding one for a single screen would
// pull a second styling system (and a second set of CSS resets) into a very
// deliberately dark UI. Web Mercator is about fifteen lines of maths, so the
// map here is plain <img> tiles positioned in a div: pan by dragging, zoom with
// the buttons or the wheel, and score pins drawn on top.
//
// Tiles come from CARTO's dark basemap, rendered from OpenStreetMap data —
// attribution is required and rendered in the corner. No cookies, no API key,
// and the only thing the tile server learns is the area being looked at.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Minus, Plus, Search } from "lucide-react";
import type { ScoreTone } from "@/lib/product-score";
import { cn } from "@/lib/utils";

const TILE_SIZE = 256;
const MIN_ZOOM = 11;
const MAX_ZOOM = 18;

// ─── Web Mercator ────────────────────────────────────────────────────────────

function project(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const s = Math.sin((clampedLat * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale,
  };
}

function unproject(x: number, y: number, zoom: number): { lat: number; lon: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const n = Math.PI - 2 * Math.PI * (y / scale);
  return {
    lat: (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
    lon: (x / scale) * 360 - 180,
  };
}

/** Metres per screen pixel at a given latitude and zoom — used to size the
 * search-radius ring and to decide when a pan is big enough to re-search. */
function metresPerPixel(lat: number, zoom: number): number {
  return (156_543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

/** A zoom level that puts a circle of `radiusM` comfortably inside the frame. */
export function zoomForRadius(radiusM: number): number {
  if (radiusM <= 1000) return 15;
  if (radiusM <= 2000) return 14;
  if (radiusM <= 5000) return 13;
  return 12;
}

// ─── Pins ────────────────────────────────────────────────────────────────────

export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  score: number;
  tone: ScoreTone;
  label: string;
}

const PIN_COLOR: Record<ScoreTone, string> = {
  emerald: "bg-emerald-500 text-emerald-950",
  green: "bg-lime-500 text-lime-950",
  orange: "bg-orange-500 text-orange-950",
  rose: "bg-rose-500 text-rose-950",
};

// ─── Component ───────────────────────────────────────────────────────────────

interface View {
  lat: number;
  lon: number;
  zoom: number;
}

export function RestaurantMap({
  center,
  radiusM,
  points,
  selectedId,
  onSelect,
  onSearchArea,
  busy = false,
  className,
}: {
  center: { lat: number; lon: number };
  radiusM: number;
  points: MapPoint[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Called when the member asks to search wherever they've panned to. */
  onSearchArea?: (center: { lat: number; lon: number }) => void;
  busy?: boolean;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({
    lat: center.lat,
    lon: center.lon,
    zoom: zoomForRadius(radiusM),
  });
  // Retina tiles are decided after mount so the server and the first client
  // render agree on the markup.
  const [retina, setRetina] = useState(false);

  useEffect(() => {
    setRetina(typeof window !== "undefined" && window.devicePixelRatio > 1.2);
  }, []);

  // A new search recentres the map.
  useEffect(() => {
    setView({ lat: center.lat, lon: center.lon, zoom: zoomForRadius(radiusM) });
  }, [center.lat, center.lon, radiusM]);

  // Track the frame size so the tile grid covers exactly what's visible.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setView((v) => ({ ...v, zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom + delta)) }));
  }, []);

  // Wheel zoom. Registered by hand because it has to be non-passive to stop the
  // page scrolling underneath the map.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // ── Panning ──
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const [panning, setPanning] = useState(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    const origin = project(d.view.lat, d.view.lon, d.view.zoom);
    const next = unproject(origin.x - dx, origin.y - dy, d.view.zoom);
    setView({ ...next, zoom: d.view.zoom });
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    drag.current = null;
    setPanning(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    // A tap on the map itself (rather than a pin) closes the open card.
    if (d && !d.moved && selectedId) onSelect(null);
  }

  // ── Tile grid ──
  const origin = useMemo(() => project(view.lat, view.lon, view.zoom), [view]);
  const topLeft = { x: origin.x - size.w / 2, y: origin.y - size.h / 2 };

  const tiles = useMemo(() => {
    if (size.w === 0 || size.h === 0) return [];
    const count = 2 ** view.zoom;
    const minX = Math.floor(topLeft.x / TILE_SIZE);
    const maxX = Math.floor((topLeft.x + size.w) / TILE_SIZE);
    const minY = Math.max(0, Math.floor(topLeft.y / TILE_SIZE));
    const maxY = Math.min(count - 1, Math.floor((topLeft.y + size.h) / TILE_SIZE));
    const out: { key: string; url: string; left: number; top: number }[] = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        // The world wraps horizontally; the poles don't.
        const wrapped = ((x % count) + count) % count;
        const sub = "abc"[Math.abs(wrapped + y) % 3];
        out.push({
          key: `${view.zoom}/${x}/${y}`,
          url: `https://${sub}.basemaps.cartocdn.com/dark_all/${view.zoom}/${wrapped}/${y}${
            retina ? "@2x" : ""
          }.png`,
          left: x * TILE_SIZE - topLeft.x,
          top: y * TILE_SIZE - topLeft.y,
        });
      }
    }
    return out;
    // topLeft is derived from origin/size, both already in the dep list.
  }, [view.zoom, topLeft.x, topLeft.y, size.w, size.h, retina]);

  /** Screen position of a coordinate, or null when it's off-frame. */
  const toScreen = useCallback(
    (lat: number, lon: number) => {
      const p = project(lat, lon, view.zoom);
      return { left: p.x - topLeft.x, top: p.y - topLeft.y };
    },
    [view.zoom, topLeft.x, topLeft.y]
  );

  // Pins: selected on top, then the healthiest, so a dense high street still
  // shows its best options first.
  const ordered = useMemo(
    () =>
      [...points].sort((a, b) =>
        a.id === selectedId ? 1 : b.id === selectedId ? -1 : a.score - b.score
      ),
    [points, selectedId]
  );

  const searchCenter = toScreen(center.lat, center.lon);
  const radiusPx = radiusM / metresPerPixel(center.lat, view.zoom);

  // Offer a re-search once the view has drifted more than a third of the search
  // radius from where the results were fetched.
  const drift =
    Math.hypot(searchCenter.left - size.w / 2, searchCenter.top - size.h / 2) *
    metresPerPixel(view.lat, view.zoom);
  const showSearchArea = !!onSearchArea && size.w > 0 && drift > radiusM / 3;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-lab-border bg-lab-card",
        className
      )}
    >
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "relative h-full w-full touch-none select-none",
          panning ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        {/* Tiles */}
        <div className="absolute inset-0">
          {tiles.map((t) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={t.key}
              src={t.url}
              alt=""
              aria-hidden
              draggable={false}
              width={TILE_SIZE}
              height={TILE_SIZE}
              className="absolute max-w-none opacity-90"
              style={{ left: t.left, top: t.top, width: TILE_SIZE, height: TILE_SIZE }}
            />
          ))}
        </div>

        {/* Search radius + centre */}
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full border border-brand-400/30 bg-brand-500/5"
          style={{
            left: searchCenter.left - radiusPx,
            top: searchCenter.top - radiusPx,
            width: radiusPx * 2,
            height: radiusPx * 2,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute h-3 w-3 rounded-full border-2 border-white/80 bg-brand-500 shadow"
          style={{ left: searchCenter.left - 6, top: searchCenter.top - 6 }}
        />

        {/* Pins */}
        {ordered.map((p) => {
          const pos = toScreen(p.lat, p.lon);
          if (pos.left < -60 || pos.top < -60 || pos.left > size.w + 60 || pos.top > size.h + 60) {
            return null;
          }
          const selected = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelect(selected ? null : p.id)}
              aria-label={`${p.label} — health score ${p.score} out of 100`}
              aria-pressed={selected}
              className={cn(
                "absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[11px] font-bold shadow-lg shadow-black/40 transition",
                PIN_COLOR[p.tone],
                selected
                  ? "z-20 scale-125 ring-2 ring-white"
                  : "ring-1 ring-black/40 hover:scale-110"
              )}
              style={{ left: pos.left, top: pos.top }}
            >
              {p.score}
            </button>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-lab-border bg-lab-bg/90 backdrop-blur">
        <button
          type="button"
          onClick={() => zoomBy(1)}
          disabled={view.zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="grid h-9 w-9 place-items-center text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(-1)}
          disabled={view.zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="grid h-9 w-9 place-items-center border-t border-lab-border text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            setView({ lat: center.lat, lon: center.lon, zoom: zoomForRadius(radiusM) })
          }
          aria-label="Back to the search area"
          className="grid h-9 w-9 place-items-center border-t border-lab-border text-slate-300 transition hover:bg-white/10"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      {/* Re-search wherever they've panned to */}
      {showSearchArea && (
        <div className="absolute inset-x-0 top-3 flex justify-center px-14">
          <button
            type="button"
            onClick={() => onSearchArea?.({ lat: view.lat, lon: view.lon })}
            disabled={busy}
            className="btn rounded-full border border-brand-500/40 bg-lab-bg/95 px-4 py-2 text-xs font-semibold text-brand-200 shadow-lg backdrop-blur hover:bg-brand-500/15"
          >
            <Search className="h-3.5 w-3.5" />
            Search this area
          </button>
        </div>
      )}

      {/* Required attribution for the tiles and the underlying data. */}
      <p className="pointer-events-none absolute bottom-0 right-0 rounded-tl-lg bg-lab-bg/80 px-2 py-0.5 text-[9px] text-slate-500">
        © OpenStreetMap contributors © CARTO
      </p>
    </div>
  );
}
