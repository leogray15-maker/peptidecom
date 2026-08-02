import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_CONDITION } from "@/lib/conditions";
import { STORY_IMAGE_MAX_CHARS } from "@/lib/story-images";
import { addStory, getProfile, tswKey } from "@/lib/tsw-db";

const promptSchema = z.string().trim().max(1000).optional().nullable();

// Before/after photos ride inside the story document, so each one is capped
// well below Firestore's 1MB limit (the client compresses to the same budget).
const storyImageSchema = z
  .string()
  .max(STORY_IMAGE_MAX_CHARS)
  .regex(/^data:image\/(jpeg|png|webp);base64,/)
  .optional()
  .nullable();

const schema = z.object({
  title: z.string().min(3).max(160),
  body: z.string().min(20).max(20000),
  monthsIn: z.number().int().min(0).max(600).optional().nullable(),
  prompts: z
    .object({ hardest: promptSchema, changed: promptSchema, advice: promptSchema })
    .optional()
    .nullable(),
  // Marketing consent is strictly opt-in; photo consent additionally requires
  // marketing consent (enforced below, not just in the UI).
  marketingConsent: z.boolean().optional(),
  photoConsent: z.boolean().optional(),
  beforeImage: storyImageSchema,
  afterImage: storyImageSchema,
  beforePhotoId: z.string().max(100).optional().nullable(),
  afterPhotoId: z.string().max(100).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please add a title and at least a few sentences." },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const marketingConsent = d.marketingConsent === true;
  const photoConsent = marketingConsent && d.photoConsent === true;

  try {
    const uid = tswKey(user);
    // Stories carry the author's condition so the wall can match readers with
    // journeys like theirs.
    const profile = await getProfile(uid).catch(() => ({}) as { condition?: string | null });
    const prompts = {
      hardest: d.prompts?.hardest || null,
      changed: d.prompts?.changed || null,
      advice: d.prompts?.advice || null,
    };
    const id = await addStory(uid, {
      title: d.title,
      body: d.body,
      monthsIn: d.monthsIn ?? null,
      authorName: user.name,
      condition: profile.condition ?? DEFAULT_CONDITION,
      prompts: prompts.hardest || prompts.changed || prompts.advice ? prompts : null,
      marketingConsent,
      // Consent timestamp is stamped server-side, never trusted from the client.
      marketingConsentAt: marketingConsent ? new Date().toISOString() : null,
      // Photos attached to a story belong on the members-only wall regardless
      // of marketing consent — that flag governs whether Arcane may reuse them
      // publicly, which is a separate question from showing them to peers.
      photoConsent,
      beforeImage: d.beforeImage ?? null,
      afterImage: d.afterImage ?? null,
      beforePhotoId: d.beforePhotoId ?? null,
      afterPhotoId: d.afterPhotoId ?? null,
      status: "new",
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Failed to save story:", err);
    return NextResponse.json(
      { error: "Couldn't post your story — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
