// Unit tests for the nearby-restaurants route (src/app/api/restaurants/route.ts).
// Overpass and Nominatim are stubbed, so this runs offline.
// Run with: npm run test:restaurants-route
import assert from "node:assert/strict";
import { GET } from "../src/app/api/restaurants/route";
import type { RestaurantSearchResult } from "../src/lib/restaurants";

let passed = 0;
const tests: [string, () => Promise<void>][] = [];
function test(name: string, fn: () => Promise<void>) {
  tests.push([name, fn]);
}

const realFetch = globalThis.fetch;

/** Stub the two upstreams. `overpass: null` makes every Overpass endpoint fail,
 * which is what a rate-limited instance looks like. Records requested URLs. */
function stubFetch(opts: {
  places?: unknown;
  reverse?: unknown;
  overpass?: unknown | null;
}) {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    if (url.includes("nominatim") && url.includes("/reverse")) {
      return opts.reverse === undefined ? new Response("{}", { status: 500 }) : json(opts.reverse);
    }
    if (url.includes("nominatim")) {
      return opts.places === undefined ? new Response("[]", { status: 500 }) : json(opts.places);
    }
    if (url.includes("interpreter")) {
      return opts.overpass == null ? new Response("", { status: 429 }) : json(opts.overpass);
    }
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
  return calls;
}

const SHOREDITCH = [
  { lat: "51.5245", lon: "-0.0775", display_name: "Shoreditch, London, England, UK" },
];

const VENUES = {
  elements: [
    {
      type: "node",
      id: 1,
      lat: 51.5246,
      lon: -0.0776,
      tags: {
        amenity: "restaurant",
        name: "Leaf & Grain",
        cuisine: "salad;mediterranean",
        "diet:vegan": "only",
      },
    },
    {
      type: "node",
      id: 2,
      lat: 51.5248,
      lon: -0.0779,
      tags: { amenity: "fast_food", name: "Chicken Hut", cuisine: "fried_chicken" },
    },
    // No name — noise on a map, not a recommendation.
    { type: "node", id: 3, lat: 51.5249, lon: -0.078, tags: { amenity: "cafe" } },
    // Outside the radius Overpass was asked for.
    {
      type: "node",
      id: 4,
      lat: 51.6,
      lon: -0.2,
      tags: { amenity: "restaurant", name: "Far Away Diner" },
    },
  ],
};

const url = (qs: string) => new Request(`http://t/api/restaurants?${qs}`);
const body = async (res: Response) => (await res.json()) as RestaurantSearchResult;

console.log("Nearby restaurants route");

test("asks for a location when it's given neither coordinates nor a place", async () => {
  stubFetch({});
  for (const qs of ["", "radius=2000", "lat=&lon=", "q="]) {
    const res = await GET(url(qs));
    assert.equal(res.status, 400, `expected 400 for "${qs}"`);
  }
});

test("geocodes a place name and returns scored venues, healthiest first", async () => {
  const calls = stubFetch({ places: SHOREDITCH, overpass: VENUES });
  const res = await GET(url("q=Shoreditch&radius=1000"));
  assert.equal(res.status, 200);
  const data = await body(res);

  assert.equal(data.center.label, "Shoreditch, London");
  assert.ok(Math.abs(data.center.lat - 51.5245) < 1e-6);
  assert.equal(data.radiusM, 1000);

  // The unnamed café and the far-away diner are both dropped.
  assert.equal(data.count, 2);
  assert.deepEqual(
    data.restaurants.map((r) => r.name),
    ["Leaf & Grain", "Chicken Hut"]
  );
  assert.equal(data.restaurants[0].analysis.band.label, "Excellent");
  assert.equal(data.restaurants[1].analysis.band.label, "Bad");

  // The Overpass query was built around the geocoded point.
  assert.ok(calls.some((c) => c.includes("interpreter")));
});

test("uses coordinates directly, and reverse-geocodes a label for them", async () => {
  const calls = stubFetch({
    reverse: { display_name: "Hoxton, London, England, UK" },
    overpass: VENUES,
  });
  const res = await GET(url("lat=51.5245&lon=-0.0775"));
  assert.equal(res.status, 200);
  const data = await body(res);
  assert.equal(data.center.label, "Hoxton, London");
  assert.equal(data.radiusM, 2000); // the default
  assert.ok(!calls.some((c) => c.includes("nominatim") && c.includes("/search")));
});

test("a failed reverse-geocode costs the label, not the results", async () => {
  stubFetch({ overpass: VENUES });
  const res = await GET(url("lat=51.5245&lon=-0.0775"));
  assert.equal(res.status, 200);
  const data = await body(res);
  assert.equal(data.center.label, null);
  assert.equal(data.count, 2);
});

test("says so when a place can't be found", async () => {
  stubFetch({ places: [], overpass: VENUES });
  const res = await GET(url("q=Nowhereshire"));
  assert.equal(res.status, 404);
  const err = (await res.json()) as { error: string };
  assert.match(err.error, /Nowhereshire/);
});

test("falls back to the Overpass mirror before giving up", async () => {
  const calls = stubFetch({ places: SHOREDITCH, overpass: null });
  const res = await GET(url("q=Shoreditch"));
  assert.equal(res.status, 502);
  const endpoints = calls.filter((c) => c.includes("interpreter"));
  assert.equal(endpoints.length, 2, "both Overpass endpoints should be tried");
  assert.notEqual(endpoints[0], endpoints[1]);
});

test("clamps an absurd radius rather than asking Overpass for it", async () => {
  stubFetch({ places: SHOREDITCH, overpass: VENUES });
  const res = await GET(url("q=Shoreditch&radius=999999"));
  const data = await body(res);
  assert.equal(data.radiusM, 10_000);
});

(async () => {
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.error(`  ✗ ${name}`);
      globalThis.fetch = realFetch;
      throw err;
    }
  }
  globalThis.fetch = realFetch;
  console.log(`\n${passed} tests passed.`);
})();
