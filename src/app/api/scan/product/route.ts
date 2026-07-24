import { NextResponse } from "next/server";
import {
  type OffApiResponse,
  type ProductSource,
  type ScannedProduct,
  normalizeOffProduct,
} from "@/lib/product-score";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Product barcode lookup — the data source behind the Yuka-style scanner.
//
// To match Yuka's hit-rate as closely as open data allows, we query ALL three
// Open Facts databases — Open Beauty Facts (cosmetics), Open Products Facts
// (general goods) and Open Food Facts (food/household) — in parallel, and try a
// couple of barcode variants (UPC-A ↔ EAN-13 leading-zero differences are a very
// common cause of a "not found"). We then pick the richest hit: a match that has
// an ingredient list beats one without. Doing it server-side lets us send the
// polite User-Agent the Open Facts projects ask for, dodge browser CORS and
// cache. Only public product data is returned — unauthenticated, no side effects.

const FIELDS = [
  "code",
  "product_name",
  "product_name_en",
  "brands",
  "image_front_small_url",
  "image_front_url",
  "image_url",
  "ingredients_text",
  "ingredients_text_en",
  "ingredients_text_with_allergens",
  "ingredients",
  // Food scoring (Open Food/Products Facts)
  "nutriscore_grade",
  "nutrition_grades",
  "nova_group",
  "additives_tags",
  "additives_n",
  "labels_tags",
  "categories_tags",
  "nutriments",
].join(",");

// Open Food Facts asks for an identifying User-Agent: "AppName/Version (contact)".
const UA = "ArcaneTrack/1.0 (skin ingredient scanner; https://arcanetrack.vercel.app)";

// Cosmetics first (this is a skin app), then general products, then food.
const SOURCES: { host: string; source: ProductSource }[] = [
  { host: "https://world.openbeautyfacts.org", source: "openbeautyfacts" },
  { host: "https://world.openproductsfacts.org", source: "openproductsfacts" },
  { host: "https://world.openfoodfacts.org", source: "openfoodfacts" },
];

const FETCH_TIMEOUT_MS = 6000;

/** Barcode variants to try. Scanners and databases disagree about leading zeros
 * between UPC-A (12) and EAN-13 (13), so we try the obvious equivalents. */
function barcodeVariants(code: string): string[] {
  const set = new Set<string>([code]);
  if (code.length === 12) set.add("0" + code); // UPC-A → EAN-13
  if (code.length === 13 && code.startsWith("0")) set.add(code.slice(1)); // EAN-13 → UPC-A
  if (code.length === 13 && code.startsWith("00")) set.add(code.slice(2));
  return [...set];
}

/** Fetch + normalise one (database, barcode) pair. Never throws — returns null
 * on network error, timeout, non-200 or a miss, so one slow/blocked source can't
 * sink the whole lookup. */
async function lookup(
  host: string,
  source: ProductSource,
  barcode: string
): Promise<ScannedProduct | null> {
  const url = `${host}/api/v2/product/${barcode}.json?fields=${FIELDS}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 86_400 }, // barcodes are stable — cache a day
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OffApiResponse;
    const product = normalizeOffProduct(barcode, data, source);
    return product.found ? product : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("barcode") ?? "").trim();

  // Barcodes are 6–14 digits (EAN-8/12/13, UPC, GTIN-14). Reject anything else.
  if (!/^\d{6,14}$/.test(raw)) {
    return NextResponse.json(
      { error: "Enter a valid barcode (6–14 digits).", found: false, code: raw },
      { status: 400 }
    );
  }

  // Every (database × barcode-variant) combination, in parallel.
  const codes = barcodeVariants(raw);
  const results = await Promise.all(
    codes.flatMap((code) => SOURCES.map((s) => lookup(s.host, s.source, code)))
  );
  const hits = results.filter((r): r is ScannedProduct => r !== null);

  // Prefer a hit that actually carries an ingredient list; otherwise any hit.
  const best = hits.find((h) => !!h.ingredientsText) ?? hits[0] ?? null;

  if (best) {
    // Report the barcode the user scanned, not the variant we matched on.
    return NextResponse.json(
      { ...best, code: raw },
      { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } }
    );
  }

  const notFound: ScannedProduct = {
    code: raw,
    name: null,
    brand: null,
    imageUrl: null,
    ingredientsText: null,
    source: "openbeautyfacts",
    found: false,
    kind: "cosmetic",
    nutriscoreGrade: null,
    novaGroup: null,
    additives: [],
    organic: false,
    nutriments: null,
  };
  return NextResponse.json(notFound, { status: 404 });
}
