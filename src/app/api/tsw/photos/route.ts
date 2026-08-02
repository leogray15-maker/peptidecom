import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  CONSENT_VERSION,
  MIN_SKIN_FRACTION,
  NON_SKIN_MESSAGE,
  PHOTO_RATE_LIMIT,
  needsConsent,
} from "@/lib/ai-grading";
import {
  addPhoto,
  countPhotosSince,
  deletePhoto,
  getProfile,
  listPhotos,
  setPhotoDermConfirmed,
  setPhotoShared,
  tswKey,
} from "@/lib/tsw-db";

/** The member's own photos — used by the story form's before/after picker. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const photos = await listPhotos(tswKey(user));
    return NextResponse.json({
      photos: photos.map((p) => ({
        id: p.id,
        takenAt: p.takenAt,
        area: p.area,
        imageData: p.imageData,
      })),
    });
  } catch (err) {
    console.error("Failed to list photos:", err);
    return NextResponse.json({ error: "Couldn't load your photos." }, { status: 503 });
  }
}

// Images are stored as compressed data-URLs inside the Firestore doc; the
// client downsizes before upload. Cap well below Firestore's 1MB doc limit.
const MAX_IMAGE_CHARS = 900_000;

const createSchema = z.object({
  takenAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  area: z.string().max(40).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  imageData: z
    .string()
    .max(MAX_IMAGE_CHARS)
    .regex(/^data:image\/(jpeg|png|webp);base64,/),
  // Client-computed severity estimate (free canvas heuristic / local model).
  estimate: z
    .object({
      score: z.number().min(0).max(100),
      composite: z.number().min(0).max(1),
      inflamedFraction: z.number().min(0).max(1),
      rednessIndex: z.number().min(0).max(1),
      version: z.number().int().min(1).max(100),
      method: z.enum(["heuristic", "tfjs", "blended"]),
      modelId: z.string().max(120).optional(),
      consentVersion: z.number().int().min(1).max(1000).optional(),
    })
    .optional()
    .nullable(),
  /** Skin-plausibility share the client measured (photo-score skinFraction).
   * Advisory: the server rejects a value that fails the gate, but a client
   * that simply omits it is still bounded by the rate limit. The tamper-proof
   * version of this check belongs at the edge — see workers/ai-grade-gate. */
  skinFraction: z.number().min(0).max(1).optional(),
});

const patchSchema = z.union([
  z.object({ id: z.string().min(1), shared: z.boolean() }),
  z.object({ id: z.string().min(1), dermConfirmed: z.boolean() }),
]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid photo — try a smaller image." },
      { status: 400 }
    );
  }

  // Non-skin gate. Cheap, and it runs before anything else touches the image.
  if (
    parsed.data.skinFraction !== undefined &&
    parsed.data.skinFraction < MIN_SKIN_FRACTION
  ) {
    return NextResponse.json({ error: NON_SKIN_MESSAGE }, { status: 422 });
  }

  const uid = tswKey(user);

  try {
    // An estimate may only be stored against a current, recorded consent.
    // Saving the photo itself is always allowed — the gate is on the grading.
    let estimate = parsed.data.estimate ?? null;
    if (estimate) {
      const profile = await getProfile(uid);
      if (needsConsent(profile.aiGradingConsent)) {
        return NextResponse.json(
          { error: "Please read and accept the AI Flare Grading disclaimer first.", needsConsent: true },
          { status: 403 }
        );
      }
      estimate = { ...estimate, consentVersion: CONSENT_VERSION };
    }

    // Per-user rate limit on submissions. Counted from the member's own photo
    // documents, so it survives serverless cold starts and multiple regions —
    // an in-memory counter would not.
    const since = new Date(Date.now() - PHOTO_RATE_LIMIT.windowMs).toISOString();
    const recent = await countPhotosSince(uid, since);
    if (recent >= PHOTO_RATE_LIMIT.max) {
      return NextResponse.json(
        {
          error: `That's ${PHOTO_RATE_LIMIT.max} photos in an hour — take a break and try again later.`,
        },
        { status: 429, headers: { "Retry-After": String(PHOTO_RATE_LIMIT.windowMs / 1000) } }
      );
    }

    const id = await addPhoto(uid, {
      takenAt: parsed.data.takenAt,
      area: parsed.data.area ?? null,
      caption: parsed.data.caption ?? null,
      imageData: parsed.data.imageData,
      shared: false, // always private by default
      estimate,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Failed to save photo:", err);
    return NextResponse.json(
      { error: "Couldn't save your photo — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    if ("shared" in parsed.data) {
      await setPhotoShared(tswKey(user), parsed.data.id, parsed.data.shared, user.name);
    } else {
      await setPhotoDermConfirmed(tswKey(user), parsed.data.id, parsed.data.dermConfirmed);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update photo:", err);
    return NextResponse.json({ error: "Couldn't update the photo." }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await deletePhoto(tswKey(user), id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete photo:", err);
    return NextResponse.json({ error: "Couldn't delete the photo." }, { status: 503 });
  }
}
