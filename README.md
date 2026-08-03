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
| **Paywall** | £11.99/mo or £70/yr (over 50% off) Stripe subscription. Gated member area, self-serve billing portal. |
| **Auth** | Firebase email/password + Google sign-in; roles (member / moderator / admin), verified-member badges. |
| **Live chat** | Real-time Firestore chat with multiple channels, members-only via custom claim. |
| **Coach** | Today's plan and the patterns in your own data — computed from your logs on our servers, no third-party AI. |
| **Flare forecast** | Local temperature, humidity, wind, UV and pollen (Open-Meteo, no key needed) scored against your condition, with the day's tips. Snapshots save to your history. |
| **Itch check-in** | One-tap 0–10 itch log, as often as it bites, with a 7-day chart and the hour your itch actually peaks. |
| **Healthy places to eat** | Every restaurant, café and takeaway around you on a dark map, each scored 0–100 for how healthy eating there is likely to be. OpenStreetMap data via Overpass — no key needed, works worldwide. |
| **Calculator** | Reconstitution maths → exact syringe units, with presets for common peptides and a live syringe fill visual. |
| **Progress** | Log weight, waist, body-fat, mood, side-effects & notes; trend charts; private to each user. |
| **Community** | Categorised forum with posts, comments and up/down votes. |
| **Vendors** | Directory with verified badges, ratings and review counts. |
| **Lab tests** | Purity / COA library tied to vendors and batches. |
| **Group buys** | Coordinate buys, track progress to a unit target, join/leave. |
| **Legal** | Research disclaimer, placeholder ToS & privacy policy, persistent disclaimer bar. |
| **Admin CRM** | `/admin` — customers with a full per-member journey view, notes, tasks, an audit log, story triage and the public **proof wall**. |

### The admin CRM

`/admin` is gated on the `ADMIN` role (or an allow-listed email) and holds the
whole back office:

| Screen | What it's for |
| --- | --- |
| **Overview** | Members, revenue, signups per week, next follow-ups, recent admin activity. |
| **Customers** | Search/filter/export, and a per-customer page that joins their billing record to their **actual journey** — tracking streaks and severity trend, peptide doses and protocols, photo timeline metadata, itch check-ins, triggers, tool scores, milestones and stories. Photos stay private: the CRM shows the record, and renders only the pictures a member chose to share publicly. |
| **Proof wall** | The one screen that controls what the public pages show as proof. Approve entries onto the site, set the running order (position 0 is the landing page's lead card) and upload the photos — see below. |
| **Stories** | Triage member story submissions, check consent, generate post-ready quote cards. |
| **Tasks / Activity** | Follow-ups and the audit trail of every admin action. |

### The public proof wall

The landing page, `/pricing` and `/results` all render the same ordered list,
assembled in `src/lib/public-testimonials.ts` from three sources the CRM
controls together (`src/lib/proof.ts`):

1. **Entries you collected** — a DM, a WhatsApp message, a review. Written and
   photographed straight into `/admin/proof`; nothing is committed or deployed.
   They start as drafts and refuse to publish without a recorded consent date.
2. **Committed entries** — the hand-written ones in `src/lib/testimonials.ts`.
   The CRM can hide them, reorder them, and upload photos that stand in for
   image files that were never added to `/public`.
3. **Member stories** — publishing one is the existing "feature on site"
   toggle, which stays gated on the member's own marketing consent.

Photos live in Firestore (`proofItems/{id}/images/{imageId}`, a document each)
rather than in the repo, so adding proof never needs a deploy. The wall flags
any live entry whose photos are unverified `/public` paths.

### Where member data lives

Everything a member enters is keyed to their account, so signing in on another
device brings it all with them:

| Data | Where |
| --- | --- |
| Daily logs, photos, triggers, itch check-ins, saved forecasts, milestones | Firestore, under `users/{uid}/…` |
| EASI, POEM and product-scan history | Firestore `users/{uid}/history/{key}`, **plus** a localStorage cache |
| Privacy switches, forecast location | The `users/{uid}` profile document |
| Account, billing, forum content | Postgres via Prisma |
| Admin notes, tasks and the audit log | Postgres (`CrmNote`, `CrmTask`, `CrmActivity`) |
| The public proof wall and its photos | Firestore `proofItems/{id}` + `proofItems/{id}/images/{imageId}` |

The tool histories are **local-first**: the device copy renders instantly and
keeps working offline, then reconciles against the account copy. Entries are
identified by their ISO timestamp, so merging two devices is a union — the same
save syncing twice can never duplicate, and a write that failed offline is
carried up on the next load (`src/lib/synced-store.ts`).

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
- `DIRECT_URL` — *optional, recommended when `DATABASE_URL` points at a connection
  pooler* (Supabase's `…pooler.supabase.com`, PgBouncer). The build pushes the Prisma
  schema, and the schema engine needs a session of its own — through a pooler that
  push competes for a small fixed number of them and fails with
  "max clients reached in session mode". Set this to the same database's **non-pooled**
  connection string and the push uses it instead. `POSTGRES_URL_NON_POOLING` works too.
- **Firebase** — create a project at [console.firebase.google.com](https://console.firebase.google.com):
  - Add a **Web app** and copy its config into the `NEXT_PUBLIC_FIREBASE_*` vars.
  - **Authentication → Sign-in method**: enable **Email/Password** and **Google**.
  - **Firestore Database**: create it (production mode).
  - **Project settings → Service accounts → Generate new private key**: put the
    values into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- Stripe keys — from your [Stripe dashboard](https://dashboard.stripe.com).
- `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY` — create two recurring prices
  (a £11.99/month and a £70/year price) on a single product and paste their IDs.

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
    admin/             # admin CRM: overview, customers, proof wall, stories, tasks, activity
    legal/             # disclaimer, terms, privacy
    api/               # auth/session, stripe, posts, comments, vote, forecast, tsw/* (logs, triggers, itch, history, prefs), admin/*
    page.tsx           # public landing / marketing page
    pricing/           # plans + checkout
    results/           # the public proof wall
  components/          # UI + client components (incl. chat-client)
    admin/             # CRM panels: customer editor, journey, proof wall, stories, notes, tasks
  lib/
    auth.ts            # session cookie verification + membership/claim helpers
    admin.ts           # admin gating, audit logging, lifecycle stages
    admin-journey.ts   # one member's whole tracker journey, for the CRM
    proof.ts           # the public proof wall's shared shapes + consent rules
    proof-db.ts        # Firestore layer for proof entries and their photos
    proof-admin.ts     # the CRM's view of the wall (every source, in render order)
    public-testimonials.ts # what the public pages actually render
    firebase-client.ts # Firebase web SDK (auth + firestore)
    firebase-admin.ts  # Firebase Admin SDK (server)
    session-client.ts  # client helpers to create/clear the session cookie
    stripe.ts          # Stripe client
    prisma.ts          # Prisma client singleton
    peptides.ts        # calculator maths + peptide presets
    forecast.ts        # flare-risk scoring from weather + the member's own logs
    restaurants.ts     # Overpass query, venue normalisation, distance maths
    restaurant-score.ts# 0–100 "how healthy is eating here" heuristic
    coach.ts           # today's plan + observations, from logged data only
    synced-store.ts    # local-first, account-synced lists (EASI/POEM/scans)
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
