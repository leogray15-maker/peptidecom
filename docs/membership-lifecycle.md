# Membership lifecycle — how access is granted and revoked

One question decides everything: **is this account paid up right now?** It's
answered by `hasAccess()` in `src/lib/membership.ts`, and every gate — page
layout, API route, Firestore claim — asks it the same way.

## The rule

```
access = staff role (ADMIN / MODERATOR)
       OR (subscriptionStatus is ACTIVE or TRIALING
           AND stripeCurrentPeriodEnd hasn't passed, + 6h grace)
```

The date check is the important half. Without it, a cancellation or a failed
renewal whose webhook never arrived leaves the row saying `ACTIVE` forever and
access is never taken away. The 6-hour grace window (`RENEWAL_GRACE_MS`) exists
so a member renewing normally isn't locked out in the minutes between Stripe
billing them and the webhook landing.

A record with **no** `stripeCurrentPeriodEnd` never lapses — that's an account
whose access doesn't come from Stripe (preview mode, comped staff).

## Where it's enforced

| Gate | Where |
|---|---|
| Member pages (everything under `src/app/(app)`) | `src/app/(app)/layout.tsx` |
| Member APIs (tracker, journal, photos, community, tools) | `requireMember()` in `src/lib/api-auth.ts` |
| Live chat (Firestore rules) | `member` custom claim, set by `syncMembershipClaim()` |
| Pricing page state | `src/app/pricing/page.tsx` |

`/api/tsw/export` is deliberately gated on **sign-in only**, not membership: a
lapsed member can still take their own data out.

## Keeping it in step with Stripe

Three paths write membership, all through `syncSubscription()` in
`src/lib/stripe-sync.ts`, all idempotent:

1. **Webhook** (`/api/stripe/webhook`) — the normal path. Handles
   `checkout.session.completed` and the `customer.subscription.*` events.
2. **Post-checkout return** (`/checkout/success`) — activates from the checkout
   session itself, so a new member gets in even if the webhook is slow or not
   configured at all, then forwards to `/dashboard?welcome=1`.
3. **`reconcileMembership()`** — the self-healing check. Runs whenever a
   record *isn't* a clean current membership: on a gated page load, on a member
   API call, at sign-in, and on the nightly sweep. Asks Stripe directly and
   writes down the answer, **in both directions** — granting access to someone
   who has paid, revoking it from someone who hasn't. It only runs on the
   failure path, so a paid-up member never triggers an API call.

### The nightly sweep

`/api/cron/subscriptions` (03:30 UTC, `vercel.json`) re-checks everyone whose
paid-up-to date has passed, plus anyone sitting in `PAST_DUE`. Page loads catch
most lapses; this catches the member who cancels and never comes back, who would
otherwise keep their Firestore chat claim indefinitely. Admins can trigger a run
manually by opening the route while signed in.

> **Vercel Hobby caps cron jobs at 2.** This is the third entry. On Hobby, drop
> it from `vercel.json` — everything except the sweep still works, and lapsed
> members are then caught the next time they load a page or sign in.

## What a lapsed member sees

`/pricing` reads their own record and explains where they stand — "your last
payment didn't go through" for `PAST_DUE`, "your membership has ended"
otherwise — with a Stripe billing-portal button, and reassurance that their
logs, photos and history are kept. It never shows a returning member the
first-time sales pitch.

## Environment

| Var | Why |
|---|---|
| `STRIPE_SECRET_KEY` | All Stripe calls |
| `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY` | The two plans |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature check — **without it the webhook is refused**, and membership rides entirely on the reconcile paths |
| `CRON_SECRET` | Lets Vercel Cron authenticate the sweep |
| `ADMIN_EMAILS` | Always-admin allow-list, bypasses billing |

## Tests

`scripts/membership.test.ts` (`npm run test:membership`) covers the rule
itself: grace window boundaries, stale `ACTIVE` rows, staff bypass, and the
statuses that must never grant access.
