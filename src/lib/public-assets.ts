import "server-only";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

/** Does a `/public` path actually resolve to a file that shipped?
 *
 * Curated testimonials name their image files by hand (see lib/testimonials.ts)
 * and the paths outlive the files — an entry can reference five photos that
 * were never committed. Rendering those is worse than rendering nothing: the
 * proof section fills with grey placeholders on a page whose whole promise is
 * "real members, real photos". So the wall checks before it points at a file.
 *
 * Fails open in both directions that matter. Anything that isn't a rooted
 * path — a data-URL from the CRM, a remote URL — is left alone, and if the
 * `public` directory isn't on the filesystem at runtime (some hosts serve it
 * only from a CDN) every path is treated as present, which is exactly what
 * this did before the check existed. */

const PUBLIC_DIR = path.join(process.cwd(), "public");

let publicDirPresent: boolean | null = null;

function publicDirIsReadable(): boolean {
  if (publicDirPresent === null) {
    try {
      publicDirPresent = statSync(PUBLIC_DIR).isDirectory();
    } catch {
      publicDirPresent = false;
    }
  }
  return publicDirPresent;
}

/** Memoised per path — the landing page asks about the same handful of files
 * on every request, and a `force-dynamic` page renders a lot. */
const cache = new Map<string, boolean>();

export function publicAssetExists(src: string): boolean {
  if (!src.startsWith("/") || src.startsWith("//")) return true;
  if (!publicDirIsReadable()) return true;

  const cached = cache.get(src);
  if (cached !== undefined) return cached;

  let exists = true;
  try {
    const clean = decodeURIComponent(src.split(/[?#]/)[0]!);
    const full = path.join(PUBLIC_DIR, clean);
    // path.join collapses "..", so this also rules out escaping /public.
    exists = full.startsWith(PUBLIC_DIR + path.sep) && existsSync(full);
  } catch {
    exists = false;
  }

  cache.set(src, exists);
  return exists;
}
