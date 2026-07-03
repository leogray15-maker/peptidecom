import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const baseUsername = normalizedEmail.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 20) || "member";
  let username = baseUsername;
  // ensure uniqueness
  for (let i = 0; i < 5; i++) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (!taken) break;
    username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
  }

  await prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash, username },
  });

  return NextResponse.json({ ok: true });
}
