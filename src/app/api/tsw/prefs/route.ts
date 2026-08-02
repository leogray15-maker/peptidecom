import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { CONSENT_KEYS } from "@/lib/tsw";
import { type TswProfile, getProfile, setConsents, setLocation, tswKey } from "@/lib/tsw-db";

// Per-profile preferences: the privacy switches and the last place the flare
// forecast was run for. Both used to be device-local; keeping them on the
// profile is what makes a second device feel like the same app.

const schema = z.object({
  consents: z.record(z.enum(CONSENT_KEYS), z.boolean()).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      label: z.string().max(120).nullable().optional(),
    })
    .optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const profile: TswProfile = await getProfile(tswKey(user));
    return NextResponse.json({
      consents: profile.consents ?? null,
      location: profile.location ?? null,
    });
  } catch (err) {
    console.error("Failed to read prefs:", err);
    return NextResponse.json({ error: "Couldn't read your preferences." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const uid = tswKey(user);
  const { consents, location } = parsed.data;
  try {
    await Promise.all([
      consents ? setConsents(uid, consents) : null,
      location
        ? setLocation(uid, {
            lat: location.lat,
            lon: location.lon,
            label: location.label ?? null,
            savedAt: new Date().toISOString(),
          })
        : null,
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save prefs:", err);
    return NextResponse.json(
      { error: "Couldn't save — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
