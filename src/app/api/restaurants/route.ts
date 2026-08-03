import { NextResponse } from "next/server";
import {
  type LatLon,
  type OverpassResponse,
  type RestaurantSearchResult,
  type ScoredRestaurant,
  buildOverpassQuery,
  byHealthiest,
  normalizeElement,
  parseRadius,
} from "@/lib/restaurants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nearby places to eat, scored for how healthy eating there is likely to be.
//
// Venues come from OpenStreetMap through the public Overpass API and place
// names from Nominatim — both free, both keyless, both the same open data the
// rest of the app already leans on. Only a coordinate (or the place you typed)
// leaves the app; no account identifier goes with it, and the scoring itself
// happens here, in src/lib/restaurant-score.ts.
//
// GET /api/restaurants?lat=51.5&lon=-0.12&radius=2000
// GET /api/restaurants?q=Shoreditch, London&radius=2000

// Both projects ask for an identifying User-Agent on API traffic.
const UA = "ArcaneTrack/1.0 (healthy restaurant finder; https://arcanetrack.vercel.app)";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const FETCH_TIMEOUT_MS = 20_000;
/** Venues don't open and close by the minute — an hour of cache keeps a
 * pan-and-search habit from hammering a volunteer-run API. */
const CACHE_SECONDS = 3600;

/** Most people can't read more than this many pins at once, and the payload
 * has to cross a phone connection. */
const MAX_RESULTS = 60;

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface NominatimPlace {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
}

/** Turn "Shoreditch, London" into a coordinate. */
async function geocode(query: string): Promise<(LatLon & { label: string }) | null> {
  const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const places = await withTimeout(async (signal) => {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal,
      next: { revalidate: 86_400 }, // place names are stable
    });
    if (!res.ok) return null;
    return (await res.json()) as NominatimPlace[];
  });

  const first = Array.isArray(places) ? places[0] : null;
  if (!first) return null;
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  // Nominatim's display_name is the full postal chain; the first two parts are
  // enough to confirm we found the right place.
  const label = (first.display_name ?? first.name ?? query).split(",").slice(0, 2).join(",").trim();
  return { lat, lon, label };
}

/** Reverse-geocode a coordinate to a place name, so a "use my location" search
 * still shows where it landed. Best-effort — a null label is fine. */
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14` +
    `&lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}`;
  const place = await withTimeout(async (signal) => {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal,
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as NominatimPlace;
  });
  const name = place?.display_name ?? place?.name ?? null;
  return name ? name.split(",").slice(0, 2).join(",").trim() : null;
}

/** Ask Overpass for the venues, falling back to the mirror. The main instance
 * is volunteer-run and rate-limits under load; one retry elsewhere turns most
 * of those into a result instead of an error screen. */
async function fetchVenues(query: string): Promise<OverpassResponse | null> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const data = await withTimeout(async (signal) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": UA,
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal,
        next: { revalidate: CACHE_SECONDS },
      });
      if (!res.ok) return null;
      return (await res.json()) as OverpassResponse;
    });
    if (data?.elements) return data;
  }
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const radiusM = parseRadius(searchParams.get("radius"));
  const q = (searchParams.get("q") ?? "").trim();

  // Both have to be present and in range. Note that Number("") and Number(null)
  // are 0, which would silently drop a location-less request into the Atlantic.
  const latParam = searchParams.get("lat")?.trim();
  const lonParam = searchParams.get("lon")?.trim();
  const rawLat = Number(latParam);
  const rawLon = Number(lonParam);
  const hasCoords =
    !!latParam &&
    !!lonParam &&
    Number.isFinite(rawLat) &&
    Number.isFinite(rawLon) &&
    Math.abs(rawLat) <= 90 &&
    Math.abs(rawLon) <= 180;

  let center: LatLon & { label: string | null };
  if (hasCoords) {
    center = { lat: rawLat, lon: rawLon, label: await reverseGeocode(rawLat, rawLon) };
  } else if (q) {
    const place = await geocode(q);
    if (!place) {
      return NextResponse.json(
        { error: `Couldn't find "${q}". Try a town, postcode or street name.` },
        { status: 404 }
      );
    }
    center = place;
  } else {
    return NextResponse.json(
      { error: "Share your location or search for a place to see what's nearby." },
      { status: 400 }
    );
  }

  const data = await fetchVenues(buildOverpassQuery(center.lat, center.lon, radiusM));
  if (!data) {
    return NextResponse.json(
      { error: "The map data service didn't answer. Give it a moment and try again." },
      { status: 502 }
    );
  }

  const restaurants = (data.elements ?? [])
    .map((el) => normalizeElement(el, center))
    .filter((r): r is ScoredRestaurant => r !== null)
    .filter((r) => r.distanceM <= radiusM * 1.05) // Overpass rounds; keep the circle honest
    .sort(byHealthiest);

  const result: RestaurantSearchResult = {
    center,
    radiusM,
    count: restaurants.length,
    restaurants: restaurants.slice(0, MAX_RESULTS),
  };

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=600, stale-while-revalidate=3600" },
  });
}
