import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  adminAuth,
  SESSION_COOKIE_MAX_AGE,
  SESSION_COOKIE_NAME,
} from "@/lib/firebase-admin";
import { isAdminEmail, syncMembershipClaim } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({ idToken: z.string().min(10) });

function makeUsername(email: string) {
  return (
    email.split("@")[0].replace(/[^a-z0-9_]/gi, "").slice(0, 20).toLowerCase() ||
    "member"
  );
}

/** Exchange a Firebase ID token for a server session cookie, and ensure a
 * matching Postgres user row exists (linking by firebaseUid, then by email). */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  const admin = await adminAuth();
  let decoded;
  try {
    decoded = await admin.verifyIdToken(parsed.data.idToken);
  } catch {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  const { uid, email, name, picture } = decoded;
  if (!email) {
    return NextResponse.json({ error: "Account has no email." }, { status: 400 });
  }
  const normalizedEmail = email.toLowerCase();

  // Find by Firebase UID, else link an existing seeded/email account, else create.
  let user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          firebaseUid: uid,
          name: byEmail.name ?? name ?? null,
          image: byEmail.image ?? picture ?? null,
        },
      });
    } else {
      // Ensure a unique username.
      let username = makeUsername(normalizedEmail);
      for (let i = 0; i < 5; i++) {
        const taken = await prisma.user.findUnique({ where: { username } });
        if (!taken) break;
        username = `${makeUsername(normalizedEmail)}${Math.floor(Math.random() * 10000)}`;
      }
      user = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email: normalizedEmail,
          name: name ?? null,
          image: picture ?? null,
          username,
          role: isAdminEmail(normalizedEmail) ? "ADMIN" : "MEMBER",
        },
      });
    }
  }

  // Ensure allow-listed emails always have the ADMIN role (bypasses the paywall).
  if (isAdminEmail(normalizedEmail) && user.role !== "ADMIN") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
  }

  // Keep the Firebase custom claim in sync with membership for Firestore rules.
  await syncMembershipClaim(uid, user.subscriptionStatus, user.role);

  // Create the session cookie from the ID token.
  const expiresIn = SESSION_COOKIE_MAX_AGE * 1000;
  const sessionCookie = await admin.createSessionCookie(parsed.data.idToken, {
    expiresIn,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return res;
}

/** Sign out: clear the session cookie. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
