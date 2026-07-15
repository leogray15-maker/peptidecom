import { NextResponse } from "next/server";

// Server-side image proxy for the imported protocol library.
//
// The library's images are hosted on external CDNs (Skool, etc.) that block
// hot-linking from other domains via Referer checks. Fetching them from our
// own server sends no Referer, so they load — and we cache hard at the edge so
// it costs almost nothing. Locked to an allowlist of hosts so this can't be
// abused as an open proxy / SSRF vector.
export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "assets.skool.com",
  "i5.walmartimages.com",
  "i5.walmartimages.ca",
]);
// Notion's own file storage (uploaded images) — signed URLs on this bucket.
const ALLOWED_HOST_SUFFIXES = [".amazonaws.com"];

function hostAllowed(host: string): boolean {
  if (ALLOWED_HOSTS.has(host)) return true;
  return ALLOWED_HOST_SUFFIXES.some((s) => host.endsWith(s));
}

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u");
  if (!u) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return NextResponse.json({ error: "Bad url" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !hostAllowed(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      // No Referer/credentials — defeats CDN hot-link protection.
      headers: { Accept: "image/*", "User-Agent": "ArcaneTrack/1.0" },
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 415 });
    }
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        // Cache a year at the edge/browser — these images never change.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("protocol-image proxy failed:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
