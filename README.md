# The Grey Lab — peptide research community

A private, members-only community platform for peptide research, built as a
custom alternative to Skool. Subscription paywall via Stripe, plus the tools a
peptide community actually wants: a reconstitution calculator, progress
tracking, a vendor directory with verification, a lab-test library, group buys
and a moderated community feed.

> **For research purposes only.** Nothing in this project is medical advice, and
> products discussed are not for human consumption. See `/legal/disclaimer`.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma** ORM + **PostgreSQL**
- **Auth.js (NextAuth v5)** — email/password credentials
- **Stripe** — subscriptions, billing portal, webhooks
- **Recharts** — progress charts
- Deploys to **Vercel**

## Features

| Area | What it does |
| --- | --- |
| **Paywall** | £25/mo or £250/yr Stripe subscription. Gated member area, self-serve billing portal. |
| **Auth** | Register / login, roles (member / moderator / admin), verified-member badges. |
| **Calculator** | Reconstitution maths → exact syringe units, with presets for common peptides and a live syringe fill visual. |
| **Progress** | Log weight, waist, body-fat, mood, side-effects & notes; trend charts; private to each user. |
| **Community** | Categorised forum with posts, comments and up/down votes. |
| **Vendors** | Directory with verified badges, ratings and review counts. |
| **Lab tests** | Purity / COA library tied to vendors and batches. |
| **Group buys** | Coordinate buys, track progress to a unit target, join/leave. |
| **Legal** | Research disclaimer, placeholder ToS & privacy policy, persistent disclaimer bar. |

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

- `DATABASE_URL` — a Postgres connection string (Vercel Postgres, Neon, Supabase, Railway…).
- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- Stripe keys — from your [Stripe dashboard](https://dashboard.stripe.com).
- `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` — create two recurring prices
  (a £25/month and a £250/year price) on a single product and paste their IDs.

### 3. Database

```bash
npm run db:push   # create tables from the Prisma schema
npm run db:seed   # optional: seed categories, demo vendors, lab tests & an admin
```

The seed creates a demo login: **admin@example.com / changeme123** (with an
active membership so you can explore the gated area immediately). Change or
remove this before going live.

### 4. Stripe webhook (local)

Stripe needs to tell the app when subscriptions change. With the
[Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Paste the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## How the paywall works

1. Visitor signs up (`/register`) → account created.
2. They're sent to `/pricing` and start a Stripe Checkout session.
3. On payment, Stripe fires webhooks (`checkout.session.completed`,
   `customer.subscription.*`) to `/api/stripe/webhook`, which updates the user's
   `subscriptionStatus` and period end in the database.
4. The member area (`src/app/(app)/*`) is guarded in its layout: non-members are
   redirected to `/pricing`, logged-out users to `/login`.
5. Members manage/cancel via the Stripe billing portal from **Settings**.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add all env vars from `.env.example` in the Vercel project settings, using
   **live** Stripe keys and your production `DATABASE_URL`. Set `AUTH_URL`,
   `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your domain.
3. In the Stripe dashboard, add a webhook endpoint pointing at
   `https://yourdomain.com/api/stripe/webhook` and copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`.
4. Run `npm run db:push` against your production database (or add it to a deploy
   step). Deploy.

## Project structure

```
prisma/
  schema.prisma        # data model
  seed.ts              # demo data
src/
  app/
    (auth)/            # login + register
    (app)/             # gated member area (paywall enforced in layout)
    legal/             # disclaimer, terms, privacy
    api/               # auth, register, stripe, posts, comments, vote, progress, group-buys
    page.tsx           # public landing / marketing page
    pricing/           # plans + checkout
  components/          # UI + client components
  lib/
    auth.ts            # Auth.js config + membership helpers
    stripe.ts          # Stripe client
    prisma.ts          # Prisma client singleton
    peptides.ts        # calculator maths + peptide presets
    utils.ts
```

## ⚠️ Before you launch

- Get **professional legal review** of the disclaimer, terms and privacy policy —
  the versions here are placeholders.
- Consider an **age gate** and jurisdiction checks.
- Add email verification and rate limiting on auth/registration.
- Add moderation tooling and a reporting flow.
- Review payment/tax obligations (Stripe Tax, VAT) for your region.
