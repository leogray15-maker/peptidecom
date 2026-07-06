import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { addPhoto, deletePhoto, setPhotoShared, tswKey } from "@/lib/tsw-db";

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
});

const patchSchema = z.object({
  id: z.string().min(1),
  shared: z.boolean(),
});

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

  try {
    const id = await addPhoto(tswKey(user), {
      takenAt: parsed.data.takenAt,
      area: parsed.data.area ?? null,
      caption: parsed.data.caption ?? null,
      imageData: parsed.data.imageData,
      shared: false, // always private by default
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
    await setPhotoShared(tswKey(user), parsed.data.id, parsed.data.shared, user.name);
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
