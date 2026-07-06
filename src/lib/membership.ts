import "server-only";
import { prisma } from "@/lib/prisma";

/** Founding-member launch offer.
 *
 * The first FOUNDING_LIMIT members who join before FOUNDING_DEADLINE pay the
 * FOUNDING_INTRO price for their first month, then lock in FOUNDING_PRICE/month
 * for as long as they stay subscribed. Everyone who joins after the offer closes
 * (slots filled OR deadline passed) pays STANDARD_PRICE/month.
 *
 * The numbers here are DISPLAY values — the real charges come from the Stripe
 * price IDs (STRIPE_PRICE_FOUNDING / STRIPE_PRICE_STANDARD) and the first-month
 * coupon (STRIPE_COUPON_FOUNDING_FIRST_MONTH). Keep them in sync with Stripe. */

export const FOUNDING_INTRO = 28; // £ first month for founding members
export const FOUNDING_PRICE = 45; // £/month locked in for founding members
export const STANDARD_PRICE = 55; // £/month for everyone after the offer
export const FOUNDING_LIMIT = Number(process.env.FOUNDING_LIMIT ?? 50);

const DEFAULT_DEADLINE = "2026-08-03T23:59:59Z"; // 28 days from launch (2026-07-06)

export function foundingDeadline(): Date {
  const raw = process.env.NEXT_PUBLIC_FOUNDING_DEADLINE ?? DEFAULT_DEADLINE;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date(DEFAULT_DEADLINE) : d;
}

export interface FoundingStatus {
  open: boolean; // is the founding offer still claimable?
  remaining: number; // spots left
  taken: number; // spots claimed
  limit: number;
  deadline: string; // ISO
  intro: number; // £ first month (founding)
  founding: number; // £/month locked (founding)
  standard: number; // £/month (standard)
}

/** How many founding spots have been claimed. Never throws (unmigrated/offline
 * DB just reports 0 so the page still renders). */
export async function foundingTaken(): Promise<number> {
  try {
    return await prisma.user.count({ where: { foundingMember: true } });
  } catch {
    return 0;
  }
}

export async function getFoundingStatus(): Promise<FoundingStatus> {
  const taken = await foundingTaken();
  const remaining = Math.max(0, FOUNDING_LIMIT - taken);
  const deadline = foundingDeadline();
  const open = remaining > 0 && Date.now() < deadline.getTime();
  return {
    open,
    remaining,
    taken,
    limit: FOUNDING_LIMIT,
    deadline: deadline.toISOString(),
    intro: FOUNDING_INTRO,
    founding: FOUNDING_PRICE,
    standard: STANDARD_PRICE,
  };
}
