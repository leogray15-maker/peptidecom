import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { CONSENT_VERSION, type AiGradingConsent } from "@/lib/ai-grading";
import { setAiGradingConsent, tswKey } from "@/lib/tsw-db";

// AI Flare Grading disclaimer consent. Server-side and account-scoped on
// purpose: localStorage would silently re-grant itself on a new device and
// can't carry a version, which is exactly what the re-prompt-on-bump rule
// needs. The client never chooses the version — it posts the version it was
// shown, and anything that doesn't match the current copy is rejected so a
// stale tab can't record consent to text nobody is reading any more.

const schema = z.object({ version: z.number().int().min(1).max(1000) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  if (parsed.data.version !== CONSENT_VERSION) {
    return NextResponse.json(
      { error: "This disclaimer has been updated — please reload and read it again.", currentVersion: CONSENT_VERSION },
      { status: 409 }
    );
  }

  const consent: AiGradingConsent = {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };

  try {
    await setAiGradingConsent(tswKey(user), consent);
    return NextResponse.json({ ok: true, consent });
  } catch (err) {
    console.error("Failed to record AI grading consent:", err);
    return NextResponse.json(
      { error: "Couldn't save that — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
