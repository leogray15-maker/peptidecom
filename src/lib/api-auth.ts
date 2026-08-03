import "server-only";
import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { reconcileMembership } from "@/lib/stripe-sync";

/**
 * Gate a member-only API route on a paid-up membership.
 *
 * The page layout gates the screens, but the routes behind them are what
 * actually read and write member data — a lapsed subscription has to stop
 * working there too, or "revoked" access is only revoked in the navigation.
 *
 * Mirrors the page gate exactly, including the Stripe re-check: a member whose
 * renewal webhook never landed is confirmed against Stripe rather than being
 * locked out of their own data.
 *
 * Returns a discriminated union, so `if (gate.error) return gate.error;`
 * narrows `gate.user` to a real user for the rest of the handler.
 */
export async function requireMember(): Promise<
  { user: User; error: null } | { user: null; error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (hasAccess(user)) return { user, error: null };

  const reconciled = await reconcileMembership(user);
  if (hasAccess(reconciled)) return { user: reconciled, error: null };

  return {
    user: null,
    error: NextResponse.json(
      {
        error: "Your membership isn't active. Renew to get back in.",
        code: "membership_required",
      },
      { status: 403 }
    ),
  };
}
