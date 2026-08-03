/* How the public proof wall orders itself — the rule that decides which entry
 * gets the landing page's lead card (a quote *and* a photo grid) and which
 * ones run as quote-only pull quotes.
 *
 * Run: npm run test:proof-wall
 */
import { type ProofSortable, compareProofEntries } from "../src/lib/proof";

let failures = 0;

function check(name: string, pass: boolean, detail?: string) {
  if (pass) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Shorthand for one entry: `entry("daniel", { hasPhotos: false })`. */
function entry(
  id: string,
  over: Partial<ProofSortable> = {}
): ProofSortable & { id: string } {
  return { id, order: null, hasPhotos: true, fallbackOrder: 0, ...over };
}

function order(entries: (ProofSortable & { id: string })[]): string[] {
  return [...entries].sort(compareProofEntries).map((e) => e.id);
}

console.log("\nProof wall order\n");

// The bug this was written for: a curated entry whose image files were never
// committed held the lead card, and every featured member story — photos and
// all — was pinned behind it at fallbackOrder 1000+.
{
  const curated = entry("curated-no-photos", { hasPhotos: false, fallbackOrder: 0 });
  const story = entry("story-with-before-after", { hasPhotos: true, fallbackOrder: 1000 });
  check(
    "a featured story with photos leads a photo-less curated entry",
    order([curated, story])[0] === "story-with-before-after",
    order([curated, story]).join(" → ")
  );
}

// …but only when the curated entry really has nothing to show. Photos present
// on both sides means the original precedence stands.
{
  const curated = entry("curated", { fallbackOrder: 0 });
  const story = entry("story", { fallbackOrder: 1000 });
  check(
    "curated entries still lead stories when both have photos",
    order([curated, story])[0] === "curated"
  );
}

// An admin's manual position is the answer, always.
{
  const positioned = entry("dragged-to-top", { order: 0, hasPhotos: false });
  const story = entry("story", { hasPhotos: true, fallbackOrder: 1000 });
  check(
    "a positioned entry outranks an unpositioned one with photos",
    order([positioned, story])[0] === "dragged-to-top"
  );
}

{
  const a = entry("a", { order: 2, hasPhotos: false });
  const b = entry("b", { order: 1, hasPhotos: true });
  const c = entry("c", { order: 0, hasPhotos: false });
  check(
    "positioned entries keep the CRM's exact order",
    order([a, b, c]).join(",") === "c,b,a",
    order([a, b, c]).join(",")
  );
}

// Newest-featured-first among stories, file order among curated entries.
{
  const newest = entry("newest", { fallbackOrder: 1000 });
  const older = entry("older", { fallbackOrder: 1001 });
  check(
    "fallback order breaks ties between equals",
    order([older, newest]).join(",") === "newest,older"
  );
}

// A wall where nothing has photos must not reshuffle itself arbitrarily.
{
  const first = entry("first", { hasPhotos: false, fallbackOrder: 0 });
  const second = entry("second", { hasPhotos: false, fallbackOrder: 1 });
  check(
    "photo-less entries fall back to their own order",
    order([second, first]).join(",") === "first,second"
  );
}

// The realistic wall from the bug report: one photo-less curated entry, two
// featured stories with consented before/afters, nothing positioned yet.
{
  const wall = [
    entry("curated-daniel", { hasPhotos: false, fallbackOrder: 0 }),
    entry("story-newest", { hasPhotos: true, fallbackOrder: 1000 }),
    entry("story-older", { hasPhotos: true, fallbackOrder: 1001 }),
    entry("story-no-photo-consent", { hasPhotos: false, fallbackOrder: 1002 }),
  ];
  check(
    "the whole wall lands photos-first, newest story leading",
    order(wall).join(",") === "story-newest,story-older,curated-daniel,story-no-photo-consent",
    order(wall).join(",")
  );
}

console.log(
  failures === 0 ? "\nAll proof wall order checks passed.\n" : `\n${failures} check(s) failed.\n`
);
process.exit(failures === 0 ? 0 : 1);
