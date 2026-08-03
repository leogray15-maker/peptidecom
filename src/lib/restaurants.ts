// Nearby places to eat — the data layer behind the healthy-restaurant map.
//
// Venues come from OpenStreetMap via the public Overpass API: free, no API key,
// no account, and the same open data the flare forecast leans on for weather.
// This module holds the parts worth testing on their own — building the
// Overpass query, turning a raw element into a venue we can score, and the
// distance maths — so the route handler stays a thin fetch-and-sort.
//
// Pure and dependency-free (Node-testable, safe on the client). No network.

import {
  type DietLevel,
  type RestaurantAnalysis,
  type VenueKind,
  analyzeRestaurant,
} from "@/lib/restaurant-score";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface Restaurant {
  /** Stable OSM identity, e.g. "node/123456". */
  id: string;
  name: string;
  kind: VenueKind;
  lat: number;
  lon: number;
  cuisines: string[];
  vegan: DietLevel | null;
  vegetarian: DietLevel | null;
  glutenFree: DietLevel | null;
  organic: DietLevel | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  openingHours: string | null;
  /** Metres from the search centre. */
  distanceM: number;
}

export interface ScoredRestaurant extends Restaurant {
  analysis: RestaurantAnalysis;
}

export interface RestaurantSearchResult {
  center: LatLon & { label: string | null };
  radiusM: number;
  count: number;
  restaurants: ScoredRestaurant[];
}

// ─── Search parameters ───────────────────────────────────────────────────────

/** Radii offered in the UI, in metres. */
export const RADIUS_OPTIONS = [1000, 2000, 5000] as const;
export const DEFAULT_RADIUS_M = 2000;
export const MAX_RADIUS_M = 10_000;
export const MIN_RADIUS_M = 400;

// ─── Overpass ────────────────────────────────────────────────────────────────

const AMENITIES = ["restaurant", "cafe", "fast_food"] as const;

/** Overpass QL for every restaurant, café and fast-food counter within
 * `radiusM` of a point. `nwr` covers nodes, ways (building footprints) and
 * relations; `out center` gives every match a single coordinate. */
export function buildOverpassQuery(lat: number, lon: number, radiusM: number, limit = 300): string {
  const around = `${Math.round(radiusM)},${lat.toFixed(6)},${lon.toFixed(6)}`;
  const clauses = AMENITIES.map((a) => `  nwr["amenity"="${a}"](around:${around});`).join("\n");
  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout center tags ${limit};`;
}

export interface OverpassElement {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements?: OverpassElement[];
}

// ─── Tag parsing ─────────────────────────────────────────────────────────────

const KINDS: Record<string, VenueKind> = {
  restaurant: "restaurant",
  cafe: "cafe",
  fast_food: "fast_food",
};

/** OSM writes diet levels as only/yes/limited/no. Anything else is unknown. */
export function parseDietLevel(value: string | undefined): DietLevel | null {
  const v = value?.trim().toLowerCase();
  if (v === "only" || v === "yes" || v === "limited" || v === "no") return v;
  return null;
}

/** `cuisine=sushi;japanese` or `cuisine=Fried Chicken` → ["sushi","japanese"] /
 * ["fried_chicken"]. Separators and casing are inconsistent in the wild. */
export function parseCuisines(value: string | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(/[;,]/)
        .map((c) => c.trim().toLowerCase().replace(/[\s-]+/g, "_"))
        .filter(Boolean)
    ),
  ];
}

function buildAddress(tags: Record<string, string>): string | null {
  const line = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const parts = [line, tags["addr:city"] ?? tags["addr:suburb"], tags["addr:postcode"]].filter(
    (p): p is string => Boolean(p && p.trim())
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

function cleanUrl(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

// ─── Distance ────────────────────────────────────────────────────────────────

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineMeters(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h))));
}

/** "450 m" / "1.2 km" — the walking-distance shorthand the list rows use. */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toFixed(metres < 10_000 ? 1 : 0)} km`;
}

// ─── Normalisation ───────────────────────────────────────────────────────────

/** Turn one Overpass element into a scored venue. Returns null for anything
 * unusable — no coordinates, no name, or an amenity we don't map. An unnamed
 * counter inside a food court is noise on a map, not a recommendation. */
export function normalizeElement(el: OverpassElement, center: LatLon): ScoredRestaurant | null {
  const tags = el.tags ?? {};
  const kind = KINDS[tags.amenity ?? ""];
  if (!kind) return null;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  const name = (tags.name ?? tags["name:en"] ?? tags.brand ?? "").trim();
  if (!name) return null;

  const cuisines = parseCuisines(tags.cuisine);
  const vegan = parseDietLevel(tags["diet:vegan"]);
  const vegetarian = parseDietLevel(tags["diet:vegetarian"]);
  const glutenFree = parseDietLevel(tags["diet:gluten_free"]);
  const organic = parseDietLevel(tags.organic);

  const restaurant: Restaurant = {
    id: `${el.type ?? "node"}/${el.id ?? `${lat},${lon}`}`,
    name,
    kind,
    lat,
    lon,
    cuisines,
    vegan,
    vegetarian,
    glutenFree,
    organic,
    address: buildAddress(tags),
    website: cleanUrl(tags.website ?? tags["contact:website"]),
    phone: (tags.phone ?? tags["contact:phone"] ?? "").trim() || null,
    openingHours: (tags.opening_hours ?? "").trim() || null,
    distanceM: haversineMeters(center, { lat, lon }),
  };

  return {
    ...restaurant,
    analysis: analyzeRestaurant({ name, kind, cuisines, vegan, vegetarian, glutenFree, organic }),
  };
}

/** Healthiest first. Ties break on how much we actually know about the venue,
 * then on how far you'd have to walk. */
export function byHealthiest(a: ScoredRestaurant, b: ScoredRestaurant): number {
  if (b.analysis.score !== a.analysis.score) return b.analysis.score - a.analysis.score;
  const rank = { high: 0, medium: 1, low: 2 } as const;
  const conf = rank[a.analysis.confidence] - rank[b.analysis.confidence];
  if (conf !== 0) return conf;
  return a.distanceM - b.distanceM;
}

/** Closest first, with the healthier venue winning a tie. */
export function byNearest(a: ScoredRestaurant, b: ScoredRestaurant): number {
  if (a.distanceM !== b.distanceM) return a.distanceM - b.distanceM;
  return b.analysis.score - a.analysis.score;
}

/** Parse and clamp a radius from the query string. */
export function parseRadius(value: string | null): number {
  if (value === null || value.trim() === "") return DEFAULT_RADIUS_M;
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_RADIUS_M;
  return Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, Math.round(n)));
}

/** Walking directions link — opens the phone's map app on both platforms. */
export function directionsUrl(r: Pick<Restaurant, "lat" | "lon">): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}&travelmode=walking`;
}
