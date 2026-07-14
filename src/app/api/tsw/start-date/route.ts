import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { dateKey, daysBetween } from "@/lib/tsw";
import { setTswStartDate, tswKey } from "@/lib/tsw-db";

const schema = z.object({
  // null clears the start date.
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  const date = parsed.data.date;
  if (date && (daysBetween(dateKey(), date) > 1 || date < "1990-01-01")) {
    return NextResponse.json({ error: "That date doesn't look right." }, { status: 400 });
  }

  try {
    await setTswStartDate(tswKey(user), date);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save start date:", err);
    return NextResponse.json(
      { error: "Couldn't save — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
