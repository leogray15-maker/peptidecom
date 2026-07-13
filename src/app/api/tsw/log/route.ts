import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { BODY_ZONES, SYMPTOMS, dateKey, daysBetween } from "@/lib/tsw";
import { deleteLog, saveLogAndAward, tswKey } from "@/lib/tsw-db";

const zoneIds = BODY_ZONES.map((z) => z.id);
const symptomIds = SYMPTOMS.map((s) => s.id);

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  areas: z.array(z.enum(zoneIds as [string, ...string[]])).max(BODY_ZONES.length),
  severity: z.number().int().min(1).max(10),
  symptoms: z.array(z.enum(symptomIds as [string, ...string[]])).max(SYMPTOMS.length),
  sleep: z.number().int().min(1).max(5).nullable(),
  mood: z.number().int().min(1).max(5).nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  // No logging the future (one day of slack for timezones ahead of the server).
  if (daysBetween(dateKey(), parsed.data.date) > 1) {
    return NextResponse.json({ error: "That date hasn't happened yet." }, { status: 400 });
  }

  try {
    const { newMilestones } = await saveLogAndAward(tswKey(user), {
      ...parsed.data,
      note: parsed.data.note ?? null,
    });
    return NextResponse.json({ ok: true, newMilestones });
  } catch (err) {
    console.error("Failed to save daily log:", err);
    return NextResponse.json(
      { error: "Couldn't save your log — the tracking database isn't reachable yet." },
      { status: 503 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = new URL(req.url).searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  try {
    await deleteLog(tswKey(user), date);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete daily log:", err);
    return NextResponse.json({ error: "Couldn't delete the entry." }, { status: 503 });
  }
}
