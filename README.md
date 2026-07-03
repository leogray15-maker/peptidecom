# The Arcane Lab — peptide research community

A private, members-only community platform for peptide research, built as a
custom alternative to Skool. Subscription paywall via Stripe, plus the tools a
peptide community actually wants: a reconstitution calculator, progress
tracking, a vendor directory with verification, a lab-test library, group buys
and a moderated community feed.

> **For research purposes only.** Nothing in this project is medical advice, and
> products discussed are not for human consumption. See `/legal/disclaimer`.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Firebase Authentication** — email/password + Google sign-in
- **Firebase Firestore** — real-time member chat
- **Prisma** ORM + **PostgreSQL** — app data (users, posts, progress, vendors…)
- **Stripe** — subscriptions, billing portal, webhooks
- **Recharts** — progress charts
- Deploys to **Vercel**

### How auth fits together

Firebase handles sign-in (email/password + Google). After sign-in the client
exchanges its Firebase ID token for a secure, httpOnly **session cookie**
(`/api/auth/session`), and the server links the Firebase UID to a **Postgres
`User` row** — so Stripe billing and all app data keep living in Postgres. The
user's Stripe subscription status is mirrored onto a Firebase **custom claim
(`member`)**, which the Firestore rules use to gate the live chat.

## Features

| Area | What it does |
| --- | --- |
| **Paywall** | £25/mo or £250/yr Stripe subscription. Gated member area, self-serve billing portal. |
| **Auth** | Firebase email/password + Google sign-in; roles (member / moderator / admin), verified-member badges. |
| **Live chat** | Real-time Firestore chat with multiple channels, members-only via custom claim. |
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
- **Firebase** — create a project at [console.firebase.google.com](https://console.firebase.google.com):
  - Add a **Web app** and copy its config into the `NEXT_PUBLIC_FIREBASE_*` vars.
  - **Authentication → Sign-in method**: enable **Email/Password** and **Google**.
  - **Firestore Database**: create it (production mode).
  - **Project settings → Service accounts → Generate new private key**: put the
    values into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- Stripe keys — from your [Stripe dashboard](https://dashboard.stripe.com).
- `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` — create two recurring prices
  (a £25/month and a £250/year price) on a single product and paste their IDs.

### 3. Database & Firestore rules

```bash
npm run db:push   # create Postgres tables from the Prisma schema
npm run db:seed   # optional: seed categories, demo vendors, lab tests & an admin
```

Deploy the chat security rules in `firestore.rules` (Firebase console → Firestore
→ Rules, or `firebase deploy --only firestore:rules`). They restrict chat to
paid-up members via the `member` custom claim.

The seed creates an **admin@example.com** row with an active membership and the
ADMIN role. Sign up in the app with that email (via Firebase) and the account
links automatically — instant admin + member access to explore the gated area.
Remove it before going live.

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

1. Visitor signs up (`/register`) via Firebase → the app creates/links a Postgres
   `User` and sets a session cookie.
2. They're sent to `/pricing` and start a Stripe Checkout session.
3. On payment, Stripe fires webhooks (`checkout.session.completed`,
   `customer.subscription.*`) to `/api/stripe/webhook`, which updates the user's
   `subscriptionStatus` in Postgres **and** the Firebase `member` custom claim.
4. The member area (`src/app/(app)/*`) is guarded in its layout: non-members are
   redirected to `/pricing`, logged-out users to `/login`. The live chat is also
   gated in Firestore rules by the `member` claim.
5. Members manage/cancel via the Stripe billing portal from **Settings**.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add all env vars from `.env.example` in the Vercel project settings (for the
   **Production** environment), using **live** Stripe keys, your production
   `DATABASE_URL`, and the Firebase client + admin values. Set
   `NEXT_PUBLIC_APP_URL` to your domain.
3. In the Stripe dashboard, add a webhook endpoint pointing at
   `https://yourdomain.com/api/stripe/webhook` and copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`.
4. In Firebase Auth settings, add your Vercel domain to **Authorized domains**
   (so Google sign-in works), and deploy `firestore.rules`.
5. Run `npm run db:push` against your production database (or add it to a deploy
   step). Deploy.

## Project structure

```
prisma/
  schema.prisma        # data model
  seed.ts              # demo data
src/
  app/
    (auth)/            # login + register (Firebase client auth)
    (app)/             # gated member area (paywall enforced in layout) incl. /chat
    legal/             # disclaimer, terms, privacy
    api/               # auth/session, stripe, posts, comments, vote, progress, group-buys
    page.tsx           # public landing / marketing page
    pricing/           # plans + checkout
  components/          # UI + client components (incl. chat-client)
  lib/
    auth.ts            # session cookie verification + membership/claim helpers
    firebase-client.ts # Firebase web SDK (auth + firestore)
    firebase-admin.ts  # Firebase Admin SDK (server)
    session-client.ts  # client helpers to create/clear the session cookie
    stripe.ts          # Stripe client
    prisma.ts          # Prisma client singleton
    peptides.ts        # calculator maths + peptide presets
    chat.ts            # chat channel definitions
    utils.ts
firestore.rules        # members-only chat security rules
```

## ⚠️ Before you launch

- Get **professional legal review** of the disclaimer, terms and privacy policy —
  the versions here are placeholders.
- Consider an **age gate** and jurisdiction checks.
- Enable **email verification** in Firebase Auth and rate limiting.
- Add moderation tooling for chat/forum and a reporting flow.
- Review payment/tax obligations (Stripe Tax, VAT) for your region.
