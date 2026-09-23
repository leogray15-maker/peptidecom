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
// Named exactly: a blanket ".amazonaws.com" suffix would let anyone point the
// proxy at any bucket or EC2 host on AWS.
const ALLOWED_EXACT_AWS = new Set(["prod-files-secure.s3.us-west-2.amazonaws.com"]);

function hostAllowed(host: string): boolean {
  return ALLOWED_HOSTS.has(host) || ALLOWED_EXACT_AWS.has(host);
}

const MAX_REDIRECTS = 3;

/** fetch() that re-checks the allowlist on every redirect hop. Following
 * redirects blindly would let an allowed host bounce the proxy anywhere. */
async function fetchAllowed(start: URL): Promise<Response | null> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url.toString(), {
      // No Referer/credentials — defeats CDN hot-link protection.
      headers: { Accept: "image/*", "User-Agent": "ArcaneTrack/1.0" },
      cache: "no-store",
      redirect: "manual",
    });
    if (res.status < 300 || res.status >= 400) return res;
    const location = res.headers.get("location");
    if (!location) return null;
    const next = new URL(location, url);
    if (next.protocol !== "https:" || !hostAllowed(next.hostname)) return null;
    url = next;
  }
  return null;
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
    const upstream = await fetchAllowed(target);
    if (!upstream || !upstream.ok || !upstream.body) {
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
