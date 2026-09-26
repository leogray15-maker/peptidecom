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
import { Chip, ScoreBadge, SegmentedControl, Tag, toneLevel } from "@/components/ui";
import { CONFIDENCE_LABEL, KIND_LABEL, type VenueKind } from "@/lib/restaurant-score";
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

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "restaurant", label: "Restaurants" },
  { value: "cafe", label: "Cafés" },
  { value: "fast_food", label: "Fast food" },
];

const cuisineLabel = (c: string) => {
  const t = c.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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
      {/* Search + Near me, one bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) void search({ q: query.trim() });
        }}
        role="search"
        className="flex items-center gap-1.5 rounded-control border border-line bg-surface p-1.5 focus-within:border-primary"
      >
        <Search className="ml-2 h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
        <label htmlFor="place-search" className="sr-only">
          Search for a place
        </label>
        <input
          id="place-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Town, postcode or street"
          className="min-h-10 min-w-0 flex-1 bg-transparent px-1 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus-visible:outline-none"
        />
        <button type="submit" disabled={loading || !query.trim()} className="btn-primary min-h-10 px-3.5">
          Search
        </button>
        <button type="button" onClick={locate} disabled={loading} className="btn-secondary min-h-10 px-3" aria-label="Near me">
          <LocateFixed className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Near me</span>
        </button>
      </form>

      {/* Filters — one row, scrolls sideways on small screens */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <SegmentedControl
          label="Distance"
          size="sm"
          value={String(radiusM)}
          onChange={(v) => changeRadius(Number(v))}
          options={RADIUS_OPTIONS.map((r) => ({ value: String(r), label: `${r / 1000} km` }))}
        />
        <SegmentedControl label="Type of place" size="sm" value={kind} onChange={setKind} options={KIND_FILTERS} />
        <Chip selected={veganOnly} onToggle={() => setVeganOnly((v) => !v)} className="shrink-0">
          Plant-based
        </Chip>
        <label className="ml-auto flex shrink-0 items-center gap-2 text-meta text-fg-muted">
          <span className="whitespace-nowrap">Sort</span>
          <span className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="min-h-9 appearance-none rounded-control border border-line bg-surface-sunken py-1 pl-3 pr-8 text-[13px] text-fg focus:border-primary focus:outline-none"
            >
              <option value="healthiest">Healthiest first</option>
              <option value="nearest">Closest first</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" aria-hidden />
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-control border border-score-bad/40 bg-score-bad/5 px-3.5 py-3 text-sm text-fg">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-score-bad" aria-hidden />
          {error}
        </p>
      )}

      {showGate && needsLocation && (
        <FeatureGate
          icon={MapPin}
          title="Where are you eating?"
          description="Share your location — or type a town, postcode or street — and we'll score every restaurant, café and takeaway around it so the healthiest ones stand out."
          action={
            <button type="button" onClick={locate} className="btn-primary min-h-11 w-full">
              <LocateFixed className="h-4 w-4" aria-hidden />
              Use my location
            </button>
          }
        />
      )}

      {loading && !result && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" aria-busy="true" aria-label="Loading places">
          <div className="h-[22rem] animate-pulse rounded-card bg-surface lg:h-[34rem]" />
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-control bg-surface" />
            ))}
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-meta text-fg-muted">
              <span className="font-mono tabular-nums text-fg">{visible.length}</span> of {result.count} place
              {result.count === 1 ? "" : "s"} within {result.radiusM / 1000} km
              {result.center.label && <> of {result.center.label}</>}
            </p>
            {loading && (
              <span className="flex items-center gap-1.5 text-meta text-fg-muted">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                Updating
              </span>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <RestaurantMap
              center={result.center}
              radiusM={result.radiusM}
              points={points}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={selectVenue}
              onSearchArea={(c) => void search({ lat: c.lat, lon: c.lon })}
              busy={loading}
              className="h-[22rem] sm:h-[26rem] lg:sticky lg:top-[88px] lg:h-[34rem]"
            />

            {visible.length === 0 ? (
              <div className="card text-center text-meta text-fg-muted">
                Nothing matches those filters here. Try a wider radius, or turn a filter off.
              </div>
            ) : (
              <ul className="list-group self-start" onMouseLeave={() => setHoveredId(null)}>
                {visible.map((r, i) => (
                  <VenueRow
                    key={r.id}
                    rowRef={(el) => {
                      rowRefs.current[r.id] = el;
                    }}
                    venue={r}
                    rank={sort === "healthiest" ? i + 1 : null}
                    open={selectedId === r.id}
                    onHover={() => setHoveredId(r.id)}
                    onToggle={() => selectVenue(selectedId === r.id ? null : r.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          <p className="pt-2 text-meta leading-relaxed text-fg-muted">
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
  onHover,
  onToggle,
}: {
  rowRef: (el: HTMLLIElement | null) => void;
  venue: ScoredRestaurant;
  rank: number | null;
  open: boolean;
  onHover: () => void;
  onToggle: () => void;
}) {
  const { analysis } = venue;
  const cuisine = venue.cuisines[0];
  return (
    <li ref={rowRef} onMouseEnter={onHover} onFocus={onHover} className={cn(open && "bg-surface-active/60")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-active"
      >
        <ScoreBadge level={toneLevel(analysis.band.tone)} value={analysis.score} label={null} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            {rank !== null && <span className="font-mono text-[11.5px] tabular-nums text-fg-muted">#{rank}</span>}
            <span className="truncate text-sm font-medium text-fg">{venue.name}</span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-fg-muted">
            <span>{analysis.band.label}</span>
            <span aria-hidden>·</span>
            {cuisine ? <Tag className="py-0 text-[11.5px]">{cuisineLabel(cuisine)}</Tag> : <span>{KIND_LABEL[venue.kind]}</span>}
            <span aria-hidden>·</span>
            <span className="font-mono tabular-nums">{formatDistance(venue.distanceM)}</span>
            {analysis.confidence === "low" && (
              <>
                <span aria-hidden>·</span>
                <span>{CONFIDENCE_LABEL.low}</span>
              </>
            )}
          </span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-fg-muted transition-transform duration-150", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="border-t border-line-subtle px-4 py-4">
          <p className="text-sm text-fg-secondary">{analysis.band.blurb}</p>
          {analysis.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {analysis.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}

          {analysis.positives.length > 0 && (
            <FindingList title="What's good here" tone="emerald" findings={analysis.positives} />
          )}
          {analysis.negatives.length > 0 && (
            <FindingList title="What to watch" tone="rose" findings={analysis.negatives} />
          )}

          <dl className="mt-4 space-y-1.5 text-meta text-fg-secondary">
            {venue.address && (
              <div className="flex gap-2">
                <dt className="sr-only">Address</dt>
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden />
                <dd>{venue.address}</dd>
              </div>
            )}
            {venue.openingHours && (
              <div className="flex gap-2">
                <dt className="sr-only">Opening hours</dt>
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden />
                <dd>{venue.openingHours}</dd>
              </div>
            )}
            {venue.phone && (
              <div className="flex gap-2">
                <dt className="sr-only">Phone</dt>
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden />
                <dd>
                  <a href={`tel:${venue.phone.replace(/\s+/g, "")}`} className="hover:text-fg">
                    {venue.phone}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <a href={directionsUrl(venue)} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-9 text-[13px]">
              <Navigation className="h-3.5 w-3.5" aria-hidden />
              Directions
            </a>
            {venue.website && (
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="btn-ghost min-h-9 text-[13px]">
                <Globe className="h-3.5 w-3.5" aria-hidden />
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
      <p className="section-label mb-2 flex items-center gap-1.5">
        <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden />
        {title}
      </p>
      <ul className="space-y-1.5">
        {findings.map((f) => (
          <li key={f.id} className="flex gap-2 text-xs">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                tone === "emerald" ? "bg-score-excellent" : "bg-score-bad"
              )}
            />
            <span>
              <span className="font-medium text-fg">{f.label}</span>{" "}
              <span className="text-fg-muted">— {f.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
