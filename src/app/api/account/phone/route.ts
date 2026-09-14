import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PHONE_INPUT_MAX, normalizePhone } from "@/lib/phone";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Any signed-in account can set this, member or not: the people we most need a
// number for are exactly the ones whose payment hasn't gone through yet.

const schema = z.object({
  phone: z.string().max(PHONE_INPUT_MAX).nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const raw = parsed.data.phone?.trim() ?? "";
  const phone = raw ? normalizePhone(raw) : null;
  if (raw && !phone) {
    return NextResponse.json(
      { error: "That doesn't look like a phone number. Include the country code." },
      { status: 400 }
    );
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data: { phone } });
  } catch (err) {
    console.error("Could not save phone number:", err);
    return NextResponse.json(
      { error: "Couldn't save that — the database isn't reachable." },
      { status: 503 }
    );
  }

  // Mirror it onto the Stripe customer so billing support has it too. Best
  // effort: a Stripe hiccup must not lose the number we just stored.
  if (user.stripeCustomerId) {
    await stripe.customers
      .update(user.stripeCustomerId, { phone: phone ?? "" })
      .catch((err) => console.error("Could not mirror phone to Stripe:", err));
  }

  return NextResponse.json({ ok: true, phone });
}
