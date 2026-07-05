import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  adminLoginConfigured,
  signAdminToken,
} from "@/lib/admin-session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Reliable admin login: email must be allow-listed (ADMIN_EMAILS) and the
 * password must match ADMIN_LOGIN_PASSWORD. Sets a signed session cookie. */
export async function POST(req: Request) {
  if (!adminLoginConfigured()) {
    return NextResponse.json(
      { error: "Admin login isn't enabled. Set ADMIN_LOGIN_PASSWORD in your env vars." },
      { status: 503 }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const emailOk = isAdminEmail(email);
  const pwOk = parsed.data.password === process.env.ADMIN_LOGIN_PASSWORD;

  if (!emailOk || !pwOk) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = signAdminToken(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
