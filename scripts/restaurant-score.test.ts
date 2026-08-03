// Unit tests for the restaurant scoring engine (src/lib/restaurant-score.ts)
// and the map-data normalisation around it (src/lib/restaurants.ts).
// Run with: npm run test:restaurant-score
import assert from "node:assert/strict";
import {
  type RestaurantSignals,
  analyzeRestaurant,
  restaurantBand,
} from "../src/lib/restaurant-score";
import {
  type OverpassElement,
  buildOverpassQuery,
  byHealthiest,
  byNearest,
  formatDistance,
  haversineMeters,
  normalizeElement,
  parseCuisines,
  parseDietLevel,
  parseRadius,
} from "../src/lib/restaurants";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

function venue(partial: Partial<RestaurantSignals>): RestaurantSignals {
  return {
    name: "Test venue",
    kind: "restaurant",
    cuisines: [],
    vegan: null,
    vegetarian: null,
    glutenFree: null,
    organic: null,
    ...partial,
  };
}

console.log("Restaurant scoring engine");

test("bands map to labels", () => {
  assert.equal(restaurantBand(90).label, "Excellent");
  assert.equal(restaurantBand(60).label, "Good");
  assert.equal(restaurantBand(30).label, "Poor");
  assert.equal(restaurantBand(10).label, "Bad");
});

test("a salad bar with vegan options scores Excellent", () => {
  const a = analyzeRestaurant(
    venue({ name: "Green Bowl Salads", cuisines: ["salad", "vegan"], vegan: "only" })
  );
  assert.ok(a.score >= 75, `got ${a.score}`);
  assert.equal(a.band.label, "Excellent");
  assert.equal(a.confidence, "high");
});

test("a fried chicken counter scores Bad", () => {
  const a = analyzeRestaurant(
    venue({ name: "Chicken Hut", kind: "fast_food", cuisines: ["fried_chicken"] })
  );
  assert.ok(a.score < 25, `got ${a.score}`);
  assert.equal(a.band.label, "Bad");
});

test("a plain restaurant with no tags lands mid-table with low confidence", () => {
  const a = analyzeRestaurant(venue({ name: "The Corner House" }));
  assert.equal(a.score, 54);
  assert.equal(a.confidence, "low");
  assert.deepEqual(a.tags, []);
});

test("fast food starts lower than a sit-down restaurant with the same menu", () => {
  const sit = analyzeRestaurant(venue({ kind: "restaurant", cuisines: ["burger"] }));
  const counter = analyzeRestaurant(venue({ kind: "fast_food", cuisines: ["burger"] }));
  assert.ok(counter.score < sit.score, `${counter.score} !< ${sit.score}`);
});

test("the fast-food category shows up as a negative finding", () => {
  const a = analyzeRestaurant(venue({ kind: "fast_food" }));
  assert.ok(a.negatives.some((n) => n.id === "kind:fast_food"));
});

test("diet and organic tags lift the score, capped", () => {
  const plain = analyzeRestaurant(venue({ cuisines: ["italian"] }));
  const catered = analyzeRestaurant(
    venue({
      cuisines: ["italian"],
      vegan: "yes",
      vegetarian: "yes",
      organic: "yes",
      glutenFree: "yes",
    })
  );
  assert.ok(catered.score > plain.score);
  // Vegan 8 + vegetarian 5 + organic 7 + gluten-free 3 = 23, under the 26 cap.
  assert.equal(catered.score - plain.score, 23);
});

test("no single group can run away with the score", () => {
  const stacked = analyzeRestaurant(
    venue({ cuisines: ["salad", "vegan", "health_food", "mediterranean", "poke", "sushi"] })
  );
  // Base 54 + the 30-point cuisine cap, and nothing more.
  assert.equal(stacked.score, 84);
});

test("scores stay inside 0–100", () => {
  const best = analyzeRestaurant(
    venue({
      name: "Organic Vegan Salad Health Kitchen",
      cuisines: ["salad", "health_food", "vegan"],
      vegan: "only",
      vegetarian: "only",
      organic: "only",
      glutenFree: "only",
    })
  );
  const worst = analyzeRestaurant(
    venue({
      name: "Fried Donut Burger Wings",
      kind: "fast_food",
      cuisines: ["fried_chicken", "donut", "burger", "fish_and_chips"],
    })
  );
  assert.ok(best.score <= 100 && best.score >= 75, `got ${best.score}`);
  assert.ok(worst.score >= 0 && worst.score < 25, `got ${worst.score}`);
});

test("the name alone is a weak signal, and says so", () => {
  const named = analyzeRestaurant(venue({ name: "Salad Days" }));
  const plain = analyzeRestaurant(venue({ name: "Days" }));
  assert.ok(named.score > plain.score);
  assert.ok(named.score - plain.score <= 8, "name hints must stay capped");
  // Confidence comes from real tags, never from the name.
  assert.equal(named.confidence, "low");
  // ...and a name hint never becomes a headline chip.
  assert.deepEqual(named.tags, []);
});

test("findings are ordered strongest first", () => {
  const a = analyzeRestaurant(venue({ cuisines: ["sandwich", "salad"], vegan: "only" }));
  assert.equal(a.positives[0].label, "Salads");
  assert.equal(a.positives[1].label, "Fully vegan");
  assert.ok(a.positives.every((f, i) => i === 0 || f.weight <= a.positives[i - 1].weight));
});

console.log("\nMap data normalisation");

test("parses OSM diet levels, ignoring anything else", () => {
  assert.equal(parseDietLevel("only"), "only");
  assert.equal(parseDietLevel("YES"), "yes");
  assert.equal(parseDietLevel(" limited "), "limited");
  assert.equal(parseDietLevel("maybe"), null);
  assert.equal(parseDietLevel(undefined), null);
});

test("parses cuisine lists with mixed separators and casing", () => {
  assert.deepEqual(parseCuisines("sushi;japanese"), ["sushi", "japanese"]);
  assert.deepEqual(parseCuisines("Fried Chicken"), ["fried_chicken"]);
  assert.deepEqual(parseCuisines("pizza, pizza"), ["pizza"]);
  assert.deepEqual(parseCuisines(undefined), []);
});

test("builds an Overpass query covering all three venue types", () => {
  const q = buildOverpassQuery(51.5074, -0.1278, 2000);
  assert.ok(q.includes('nwr["amenity"="restaurant"](around:2000,51.507400,-0.127800);'));
  assert.ok(q.includes('"amenity"="cafe"'));
  assert.ok(q.includes('"amenity"="fast_food"'));
  assert.ok(q.includes("out center tags"));
});

test("normalises an element into a scored venue", () => {
  const el: OverpassElement = {
    type: "node",
    id: 42,
    lat: 51.51,
    lon: -0.13,
    tags: {
      amenity: "restaurant",
      name: "Leaf & Grain",
      cuisine: "salad;mediterranean",
      "diet:vegan": "yes",
      "addr:housenumber": "12",
      "addr:street": "High Street",
      "addr:city": "London",
      website: "leafandgrain.example",
      opening_hours: "Mo-Fr 08:00-18:00",
    },
  };
  const r = normalizeElement(el, { lat: 51.5074, lon: -0.1278 });
  assert.ok(r);
  assert.equal(r.id, "node/42");
  assert.equal(r.name, "Leaf & Grain");
  assert.equal(r.address, "12 High Street, London");
  assert.equal(r.website, "https://leafandgrain.example/");
  assert.deepEqual(r.cuisines, ["salad", "mediterranean"]);
  assert.equal(r.analysis.band.label, "Excellent");
  assert.ok(r.distanceM > 0 && r.distanceM < 1000, `got ${r.distanceM}`);
});

test("drops elements we can't put on a map or name", () => {
  const center = { lat: 51.5, lon: -0.1 };
  assert.equal(normalizeElement({ tags: { amenity: "restaurant", name: "X" } }, center), null);
  assert.equal(normalizeElement({ lat: 51.5, lon: -0.1, tags: { amenity: "bar", name: "X" } }, center), null);
  assert.equal(normalizeElement({ lat: 51.5, lon: -0.1, tags: { amenity: "cafe" } }, center), null);
});

test("uses a way's centre point when it has no coordinates of its own", () => {
  const r = normalizeElement(
    { type: "way", id: 7, center: { lat: 51.5, lon: -0.1 }, tags: { amenity: "cafe", name: "C" } },
    { lat: 51.5, lon: -0.1 }
  );
  assert.ok(r);
  assert.equal(r.id, "way/7");
  assert.equal(r.distanceM, 0);
});

test("distance maths matches a known pair", () => {
  // Big Ben → St Paul's Cathedral is a shade over 3 km.
  const d = haversineMeters({ lat: 51.5007, lon: -0.1246 }, { lat: 51.5138, lon: -0.0984 });
  assert.ok(Math.abs(d - 2200) < 400, `got ${d}`);
});

test("formats walking distances", () => {
  assert.equal(formatDistance(120), "120 m");
  assert.equal(formatDistance(1240), "1.2 km");
  assert.equal(formatDistance(12_400), "12 km");
});

test("clamps the radius to something a volunteer API can serve", () => {
  assert.equal(parseRadius("2000"), 2000);
  assert.equal(parseRadius("999999"), 10_000);
  assert.equal(parseRadius("1"), 400);
  assert.equal(parseRadius(null), 2000);
  assert.equal(parseRadius("banana"), 2000);
});

test("sorts healthiest first, then by what we know, then by distance", () => {
  const at = (score: number, distanceM: number, cuisines: string[] = []) => {
    const el: OverpassElement = {
      type: "node",
      id: score * 1000 + distanceM,
      lat: 51.5,
      lon: -0.1,
      tags: { amenity: "restaurant", name: `V${score}`, cuisine: cuisines.join(";") },
    };
    const r = normalizeElement(el, { lat: 51.5, lon: -0.1 })!;
    return { ...r, distanceM };
  };
  const near = at(0, 100);
  const healthyFar = at(1, 900, ["salad"]);
  const healthiest = [near, healthyFar].sort(byHealthiest);
  assert.equal(healthiest[0].name, "V1");
  const nearest = [healthyFar, near].sort(byNearest);
  assert.equal(nearest[0].name, "V0");
});

console.log(`\n${passed} tests passed.`);
