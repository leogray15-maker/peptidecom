import { NextResponse } from "next/server";
import {
  type OffApiResponse,
  type ScannedProduct,
  normalizeOffProduct,
} from "@/lib/product-score";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Product barcode lookup — the data source behind the Yuka-style scanner.
//
// We proxy Open Beauty Facts (cosmetics) first, then fall back to Open Food
// Facts, both free/open databases. Doing it server-side lets us send the polite
// User-Agent the Open Facts projects ask for, dodge browser CORS, and cache the
// response. Only public product data is returned — no user data is involved, so
// the route stays unauthenticated and side-effect-free.

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
  "ingredients",
].join(",");

const UA = "ArcaneTrack/1.0 (skin ingredient scanner; contact via app)";

const SOURCES: { host: string; source: ScannedProduct["source"] }[] = [
  { host: "https://world.openbeautyfacts.org", source: "openbeautyfacts" },
  { host: "https://world.openfoodfacts.org", source: "openfoodfacts" },
];

/** Fetch + normalise one source. Returns null on network/parse failure so the
 * caller can try the next source. */
async function lookup(
  host: string,
  source: ScannedProduct["source"],
  barcode: string
): Promise<ScannedProduct | null> {
  const url = `${host}/api/v2/product/${barcode}.json?fields=${FIELDS}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      // Cache product data for a day — barcodes are stable.
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OffApiResponse;
    return normalizeOffProduct(barcode, data, source);
  } catch {
    return null;
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

  for (const { host, source } of SOURCES) {
    const product = await lookup(host, source, raw);
    if (product?.found) {
      return NextResponse.json(product, {
        headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
      });
    }
  }

  // Reachable databases, but no product on this barcode.
  const notFound: ScannedProduct = {
    code: raw,
    name: null,
    brand: null,
    imageUrl: null,
    ingredientsText: null,
    source: "openbeautyfacts",
    found: false,
  };
  return NextResponse.json(notFound, { status: 404 });
}
