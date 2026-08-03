"use client";

// The healthy-restaurant finder.
//
// Ask for a location (the browser's, or a place typed in), fetch every
// restaurant, café and fast-food counter around it from OpenStreetMap, score
// each one for how healthy eating there is likely to be, and show the result
// twice: as colour-coded pins on the map, and as a ranked list underneath.
// Tapping either one selects the venue in the other.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Globe,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Search,
  Clock,
  UtensilsCrossed,
} from "lucide-react";
import { FeatureGate } from "@/components/feature-gate";
import { type MapPoint, RestaurantMap } from "@/components/restaurant-map";
import { TONE_TEXT } from "@/components/score-ring";
import {
  CONFIDENCE_LABEL,
  KIND_LABEL,
  TONE_BG,
  TONE_BORDER,
  type VenueKind,
} from "@/lib/restaurant-score";
import {
  DEFAULT_RADIUS_M,
  RADIUS_OPTIONS,
  type RestaurantSearchResult,
  type ScoredRestaurant,
  byHealthiest,
  byNearest,
  directionsUrl,
  formatDistance,
} from "@/lib/restaurants";
import { cn } from "@/lib/utils";

type Sort = "healthiest" | "nearest";
type KindFilter = "all" | VenueKind;

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "Everywhere" },
  { id: "restaurant", label: "Restaurants" },
  { id: "cafe", label: "Cafés" },
  { id: "fast_food", label: "Fast food" },
];

/** Where the member last searched, so the screen opens where they left it. */
const LAST_SEARCH_KEY = "arcane.restaurants.last";

interface LastSearch {
  lat: number;
  lon: number;
  label: string | null;
  radiusM: number;
}

function readLastSearch(): LastSearch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_SEARCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastSearch;
    return typeof parsed?.lat === "number" && typeof parsed?.lon === "number" ? parsed : null;
  } catch {
    return null;
  }
}

export function RestaurantsClient() {
  const [result, setResult] = useState<RestaurantSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [query, setQuery] = useState("");
  const [radiusM, setRadiusM] = useState<number>(DEFAULT_RADIUS_M);
  const [sort, setSort] = useState<Sort>("healthiest");
  const [kind, setKind] = useState<KindFilter>("all");
  const [veganOnly, setVeganOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});

  /** One search. Either coordinates or a place name — the route resolves both
   * to a centre and returns the venues around it, already scored. */
  const search = useCallback(
    async (params: { lat?: number; lon?: number; q?: string; radius?: number }) => {
      const radius = params.radius ?? radiusM;
      setLoading(true);
      setError(null);
      setSelectedId(null);
      try {
        const qs = new URLSearchParams({ radius: String(radius) });
        if (params.q) qs.set("q", params.q);
        if (params.lat != null && params.lon != null) {
          qs.set("lat", params.lat.toFixed(5));
          qs.set("lon", params.lon.toFixed(5));
        }
        const res = await fetch(`/api/restaurants?${qs.toString()}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body.error ?? "Couldn't load what's nearby.");
          return;
        }
        const data = body as RestaurantSearchResult;
        setResult(data);
        setNeedsLocation(false);
        try {
          window.localStorage.setItem(
            LAST_SEARCH_KEY,
            JSON.stringify({
              lat: data.center.lat,
              lon: data.center.lon,
              label: data.center.label,
              radiusM: data.radiusM,
            } satisfies LastSearch)
          );
        } catch {
          // A full or blocked localStorage is no reason to lose the results.
        }
      } catch {
        setError("Couldn't reach the server — check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [radiusM]
  );

  /** Ask the browser where we are, then search around it. */
  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser can't share a location. Search for a place instead.");
      setNeedsLocation(true);
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => void search({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {
        setLoading(false);
        setNeedsLocation(true);
        setError("Location permission was declined. Search for a place instead.");
      },
      { timeout: 10_000, maximumAge: 300_000 }
    );
  }, [search]);

  // Open on the last place searched; otherwise ask for a location.
  useEffect(() => {
    const last = readLastSearch();
    if (last) {
      setRadiusM(last.radiusM);
      void search({ lat: last.lat, lon: last.lon, radius: last.radiusM });
    } else {
      setNeedsLocation(true);
    }
    // Deliberately once, on mount: `search` closes over the radius, and this
    // effect supplies its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeRadius(next: number) {
    setRadiusM(next);
    if (result) void search({ lat: result.center.lat, lon: result.center.lon, radius: next });
  }

  const visible = useMemo(() => {
    const all = result?.restaurants ?? [];
    return all
      .filter((r) => kind === "all" || r.kind === kind)
      .filter((r) => !veganOnly || r.vegan === "yes" || r.vegan === "only" || r.cuisines.includes("vegan"))
      .sort(sort === "healthiest" ? byHealthiest : byNearest);
  }, [result, kind, veganOnly, sort]);

  const points: MapPoint[] = useMemo(
    () =>
      visible.map((r) => ({
        id: r.id,
        lat: r.lat,
        lon: r.lon,
        score: r.analysis.score,
        tone: r.analysis.band.tone,
        label: r.name,
      })),
    [visible]
  );

  /** Selecting a pin scrolls its row into view, so the map and the list never
   * disagree about what you're looking at. */
  function selectVenue(id: string | null) {
    setSelectedId(id);
    if (!id) return;
    const row = rowRefs.current[id];
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const showGate = !result && !loading;

  return (
    <div className="space-y-4">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) void search({ q: query.trim() });
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Town, postcode or street"
            aria-label="Search for a place"
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading || !query.trim()} className="btn-primary flex-1 sm:flex-none">
            Search
          </button>
          <button
            type="button"
            onClick={locate}
            disabled={loading}
            className="btn-secondary flex-1 sm:flex-none"
          >
            <LocateFixed className="h-4 w-4" />
            Near me
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-lab-border p-0.5">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => changeRadius(r)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                radiusM === r ? "bg-brand-500/20 text-brand-200" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {r / 1000} km
            </button>
          ))}
        </div>
        <div className="flex rounded-xl border border-lab-border p-0.5">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setKind(f.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                kind === f.id ? "bg-brand-500/20 text-brand-200" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVeganOnly((v) => !v)}
          aria-pressed={veganOnly}
          className={cn(
            "rounded-xl border px-3 py-2 text-xs font-semibold transition",
            veganOnly
              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
              : "border-lab-border text-slate-400 hover:text-slate-200"
          )}
        >
          Plant-based only
        </button>
        <button
          type="button"
          onClick={() => setSort((s) => (s === "healthiest" ? "nearest" : "healthiest"))}
          className="ml-auto rounded-xl border border-lab-border px-3 py-2 text-xs font-semibold text-slate-300 transition hover:text-white"
        >
          {sort === "healthiest" ? "Healthiest first" : "Closest first"}
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {showGate && needsLocation && (
        <FeatureGate
          icon={MapPin}
          title="Where are you eating?"
          description="Share your location — or type a town, postcode or street — and we'll score every restaurant, café and takeaway around it so the healthiest ones stand out."
          action={
            <button type="button" onClick={locate} className="btn-accent w-full">
              <LocateFixed className="h-5 w-5" />
              Use my location
            </button>
          }
        />
      )}

      {loading && !result && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Looking at what&rsquo;s around you…
        </div>
      )}

      {result && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-slate-400">
              {visible.length} of {result.count} place{result.count === 1 ? "" : "s"} within{" "}
              {result.radiusM / 1000} km
              {result.center.label && <> of {result.center.label}</>}
            </p>
            {loading && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating
              </span>
            )}
          </div>

          <RestaurantMap
            center={result.center}
            radiusM={result.radiusM}
            points={points}
            selectedId={selectedId}
            onSelect={selectVenue}
            onSearchArea={(c) => void search({ lat: c.lat, lon: c.lon })}
            busy={loading}
            className="h-[22rem] sm:h-[26rem]"
          />

          {visible.length === 0 ? (
            <div className="card text-center text-sm text-slate-400">
              Nothing matches those filters here. Try a wider radius, or turn a filter off.
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((r, i) => (
                <VenueRow
                  key={r.id}
                  rowRef={(el) => {
                    rowRefs.current[r.id] = el;
                  }}
                  venue={r}
                  rank={sort === "healthiest" ? i + 1 : null}
                  open={selectedId === r.id}
                  onToggle={() => selectVenue(selectedId === r.id ? null : r.id)}
                />
              ))}
            </ul>
          )}

          <p className="pt-2 text-center text-xs leading-relaxed text-slate-500">
            Scores are our own estimate from open map data — the venue&rsquo;s category, its listed
            cuisines and its diet tags — not an analysis of the actual menu. Treat them as a
            starting point, and check the menu before you order.
          </p>
        </>
      )}
    </div>
  );
}

// ─── One venue ───────────────────────────────────────────────────────────────

function VenueRow({
  rowRef,
  venue,
  rank,
  open,
  onToggle,
}: {
  rowRef: (el: HTMLLIElement | null) => void;
  venue: ScoredRestaurant;
  rank: number | null;
  open: boolean;
  onToggle: () => void;
}) {
  const { analysis } = venue;
  return (
    <li
      ref={rowRef}
      className={cn(
        "overflow-hidden rounded-2xl border bg-lab-card transition",
        open ? TONE_BORDER[analysis.band.tone] : "border-lab-border"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3.5 text-left"
      >
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-black/80",
            TONE_BG[analysis.band.tone]
          )}
        >
          {analysis.score}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            {rank !== null && <span className="text-xs font-semibold text-slate-600">#{rank}</span>}
            <span className="truncate font-semibold text-white">{venue.name}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
            <span className={cn("font-semibold", TONE_TEXT[analysis.band.tone])}>
              {analysis.band.label}
            </span>
            <span aria-hidden>·</span>
            <span>{KIND_LABEL[venue.kind]}</span>
            <span aria-hidden>·</span>
            <span>{formatDistance(venue.distanceM)}</span>
            {analysis.confidence === "low" && (
              <>
                <span aria-hidden>·</span>
                <span className="text-slate-500">{CONFIDENCE_LABEL.low}</span>
              </>
            )}
          </span>
          {analysis.tags.length > 0 && (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {analysis.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-lab-border px-2 py-0.5 text-[10px] text-slate-400"
                >
                  {t}
                </span>
              ))}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-500 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-lab-border px-3.5 py-4">
          <p className="text-sm text-slate-300">{analysis.band.blurb}</p>

          {analysis.positives.length > 0 && (
            <FindingList title="What's good here" tone="emerald" findings={analysis.positives} />
          )}
          {analysis.negatives.length > 0 && (
            <FindingList title="What to watch" tone="rose" findings={analysis.negatives} />
          )}

          <dl className="mt-4 space-y-1.5 text-xs text-slate-400">
            {venue.address && (
              <div className="flex gap-2">
                <dt className="sr-only">Address</dt>
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <dd>{venue.address}</dd>
              </div>
            )}
            {venue.openingHours && (
              <div className="flex gap-2">
                <dt className="sr-only">Opening hours</dt>
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <dd>{venue.openingHours}</dd>
              </div>
            )}
            {venue.phone && (
              <div className="flex gap-2">
                <dt className="sr-only">Phone</dt>
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <dd>
                  <a href={`tel:${venue.phone.replace(/\s+/g, "")}`} className="hover:text-slate-200">
                    {venue.phone}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={directionsUrl(venue)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs"
            >
              <Navigation className="h-3.5 w-3.5" />
              Directions
            </a>
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs"
              >
                <Globe className="h-3.5 w-3.5" />
                Menu / website
              </a>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function FindingList({
  title,
  tone,
  findings,
}: {
  title: string;
  tone: "emerald" | "rose";
  findings: { id: string; label: string; note: string }[];
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <UtensilsCrossed className="h-3.5 w-3.5" />
        {title}
      </p>
      <ul className="space-y-1.5">
        {findings.map((f) => (
          <li key={f.id} className="flex gap-2 text-xs">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                tone === "emerald" ? "bg-emerald-400" : "bg-rose-400"
              )}
            />
            <span>
              <span className="font-medium text-slate-200">{f.label}</span>{" "}
              <span className="text-slate-500">— {f.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
