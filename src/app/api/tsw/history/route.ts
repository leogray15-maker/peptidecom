import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/api-auth";
import {
  HISTORY_KEYS,
  HISTORY_LIMITS,
  clearHistoryKey,
  getHistory,
  mergeHistory,
  tswKey,
} from "@/lib/tsw-db";

// Account copy of the tool histories (EASI, POEM, product scans). The client
// keeps a local copy for offline use and reconciles against this on load —
// see src/lib/synced-store.ts.

const keySchema = z.enum(HISTORY_KEYS as [string, ...string[]]);

const entrySchema = z.object({
  at: z.string().datetime(),
  score: z.number().finite(),
  // Tool-specific payload — shape belongs to the tool, not this route. Capped
  // by the entry limit per key, and by Firestore's 1MB document ceiling.
  detail: z.unknown(),
});

// Entries are validated one at a time below rather than as a whole array: a
// single malformed row (an old client, a hand-edited localStorage blob) must
// not 400 the batch and strand every good entry on that device forever.
const postSchema = z.object({
  key: keySchema,
  entries: z.array(z.unknown()).max(200),
});

/** GET /api/tsw/history?key=easi — the account's copy of one list. */
export async function GET(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const parsed = keySchema.safeParse(new URL(req.url).searchParams.get("key"));
  if (!parsed.success) return NextResponse.json({ error: "Unknown history key." }, { status: 400 });

  try {
    return NextResponse.json({ entries: await getHistory(tswKey(user), parsed.data) });
  } catch (err) {
    console.error("Failed to read tool history:", err);
    return NextResponse.json({ error: "Couldn't read your history." }, { status: 503 });
  }
}

/** POST — upload this device's entries and get the reconciled list back. */
export async function POST(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const { key } = parsed.data;
  const entries = parsed.data.entries
    .map((e) => entrySchema.safeParse(e))
    .flatMap((r) => (r.success ? [r.data] : []));

  try {
    const merged = await mergeHistory(
      tswKey(user),
      key,
      // Trim before the write: a device that has been offline for months
      // shouldn't be able to push more than the key ever keeps.
      entries.slice(-(HISTORY_LIMITS[key] ?? 60)).map((e) => ({
        at: e.at,
        score: e.score,
        detail: e.detail ?? null,
      }))
    );
    return NextResponse.json({ entries: merged });
  } catch (err) {
    console.error("Failed to sync tool history:", err);
    return NextResponse.json({ error: "Couldn't sync your history." }, { status: 503 });
  }
}

/** DELETE /api/tsw/history?key=easi — clear the account copy. */
export async function DELETE(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const parsed = keySchema.safeParse(new URL(req.url).searchParams.get("key"));
  if (!parsed.success) return NextResponse.json({ error: "Unknown history key." }, { status: 400 });

  try {
    await clearHistoryKey(tswKey(user), parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to clear tool history:", err);
    return NextResponse.json({ error: "Couldn't clear your history." }, { status: 503 });
  }
}
