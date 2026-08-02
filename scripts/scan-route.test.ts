// Unit tests for the barcode lookup route (src/app/api/scan/product/route.ts).
// The Open Facts databases are stubbed, so this runs offline.
// Run with: npm run test:scan-route
import assert from "node:assert/strict";
import { GET } from "../src/app/api/scan/product/route";

let passed = 0;
const tests: [string, () => Promise<void>][] = [];
function test(name: string, fn: () => Promise<void>) {
  tests.push([name, fn]);
}

type Stub = Record<string, unknown>;

/** Stub the three Open Facts hosts. Each entry is keyed by host fragment; the
 * value is either a payload (200) or null (404). Records the URLs requested. */
function stubFetch(byHost: Record<string, Stub | null>) {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    for (const [host, payload] of Object.entries(byHost)) {
      if (url.includes(host)) {
        if (payload === null) break;
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
  return calls;
}

const NUTELLA_FOOD = {
  status: 1,
  product: {
    product_name: "Nutella",
    nutriscore_grade: "e",
    ingredients_text: "Sugar, Palm Oil, Hazelnuts",
    nutriments: {
      "energy-kcal_100g": 539,
      sugars_100g: 56.3,
      "saturated-fat_100g": 10.6,
      salt_100g: 0.107,
    },
  },
};

const NUTELLA_BEAUTY_STUB = {
  status: 1,
  product: { product_name: "Nutella", ingredients_text: "Sugar, Palm Oil, Hazelnuts" },
};

console.log("Barcode lookup route");

test("rejects a barcode that isn't 6–14 digits", async () => {
  for (const bad of ["abc", "123", "1".repeat(15), ""]) {
    const res = await GET(new Request(`http://t/api/scan/product?barcode=${bad}`));
    assert.equal(res.status, 400, `expected 400 for "${bad}"`);
  }
});

test("returns a cosmetic hit from Open Beauty Facts", async () => {
  stubFetch({
    openbeautyfacts: {
      status: 1,
      product: {
        product_name: "Lipikar Baume",
        brands: "La Roche-Posay",
        ingredients_text: "Aqua, Glycerin, Butyrospermum Parkii Butter",
      },
    },
    openproductsfacts: null,
    openfoodfacts: null,
  });
  const res = await GET(new Request("http://t/api/scan/product?barcode=3337875597197"));
  const p = await res.json();
  assert.equal(res.status, 200);
  assert.equal(p.found, true);
  assert.equal(p.kind, "cosmetic");
  assert.equal(p.name, "Lipikar Baume");
});

test("a food listed in both databases is scored as food, not skincare", async () => {
  // The beauty database also carries some foods, with ingredients but no
  // nutrition — picking that hit would score a chocolate spread for skin.
  stubFetch({
    openbeautyfacts: NUTELLA_BEAUTY_STUB,
    openproductsfacts: null,
    openfoodfacts: NUTELLA_FOOD,
  });
  const res = await GET(new Request("http://t/api/scan/product?barcode=3017620422003"));
  const p = await res.json();
  assert.equal(p.kind, "food");
  assert.equal(p.nutriscoreGrade, "e");
  assert.ok(p.nutriments, "expected nutriments on a food hit");
});

test("tries the UPC-A ↔ EAN-13 leading-zero variants", async () => {
  const calls = stubFetch({ openbeautyfacts: null, openproductsfacts: null, openfoodfacts: null });
  await GET(new Request("http://t/api/scan/product?barcode=012345678905"));
  assert.ok(calls.some((u) => u.includes("/012345678905.json")), "original barcode queried");
  assert.ok(calls.some((u) => u.includes("/0012345678905.json")), "EAN-13 variant queried");
});

test("reports the scanned barcode even when a variant matched", async () => {
  stubFetch({
    openbeautyfacts: { status: 1, product: { product_name: "Variant Match" } },
    openproductsfacts: null,
    openfoodfacts: null,
  });
  const res = await GET(new Request("http://t/api/scan/product?barcode=012345678905"));
  const p = await res.json();
  assert.equal(p.code, "012345678905");
});

test("a miss everywhere is a clean 404, not a crash", async () => {
  stubFetch({ openbeautyfacts: null, openproductsfacts: null, openfoodfacts: null });
  const res = await GET(new Request("http://t/api/scan/product?barcode=0000000000000"));
  const p = await res.json();
  assert.equal(res.status, 404);
  assert.equal(p.found, false);
  assert.equal(p.code, "0000000000000");
});

test("one database throwing doesn't sink the lookup", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("openbeautyfacts")) throw new Error("network down");
    if (url.includes("openfoodfacts")) {
      return new Response(JSON.stringify(NUTELLA_FOOD), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
  const res = await GET(new Request("http://t/api/scan/product?barcode=3017620422003"));
  const p = await res.json();
  assert.equal(res.status, 200);
  assert.equal(p.name, "Nutella");
});

async function run() {
  const original = globalThis.fetch;
  try {
    for (const [name, fn] of tests) {
      try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
      } catch (err) {
        console.error(`  ✗ ${name}`);
        throw err;
      }
    }
  } finally {
    globalThis.fetch = original;
  }
  console.log(`\n${passed} scan-route tests passed.\n`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
