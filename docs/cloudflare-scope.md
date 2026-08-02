# Cloudflare integration — scope

Written against the repo as it stands. **Nothing here has been executed
against live data.** Turnstile and the edge Worker source are the only parts
built; R2, Images and cache rules are scoped only, as requested.

---

## 0. The thing that has to be settled first: DNS and proxy status

Nothing in this repo references Cloudflare. The app deploys to Vercel
(`vercel.json`), and `next.config.js` allows remote images from `**`. I cannot
see the DNS zone from here, so **I cannot confirm whether traffic is proxied
through Cloudflare (orange cloud) or resolves straight to Vercel.**

This gates three of the five items below:

| Item | Needs proxied DNS? |
|---|---|
| R2 photo storage | No — S3 API, works from anywhere |
| Cloudflare Images | No for delivery URLs; yes for `cf.image` transforms at the edge |
| Turnstile | No |
| Worker (edge rate-limit) | **Yes** |
| Cache rules | **Yes** |

**Please confirm the current setup before the Worker or cache rules are
attempted.** If the domain is not proxied today, moving it is its own change
with its own blast radius (TLS mode, origin certificates, Vercel's own edge
network sitting behind Cloudflare's) and should not be bundled with this work.

---

## 1. R2 for photo storage — migration scope

### What exists now

Photos are **not** in Firebase Storage. They are compressed data-URLs stored
**inline inside Firestore documents**:

- `users/{uid}/photos/{id}.imageData` — a `data:image/jpeg;base64,…` string
- `MAX_IMAGE_CHARS = 900_000` (`src/app/api/tsw/photos/route.ts`), sized to stay
  under Firestore's 1 MB document limit
- Shared photos are **duplicated** into `sharedPhotos/{uid}_{photoId}` with a
  second full copy of the bytes (`setPhotoShared` in `src/lib/tsw-db.ts`)
- Story before/afters add a third and fourth copy
  (`recoveryStories.beforeImage` / `afterImage`)
- `src/lib/image-compress.ts` downsizes client-side before upload

This matters more than a storage-vendor swap usually would:

- Every photo read pulls the full base64 through Firestore's per-document read.
  A 40-photo timeline is ~36 MB of document reads on one page load.
- Base64 inflates bytes by ~33% over the wire, and Firestore charges by
  document read, not by byte — so the cost profile is bad in two directions.
- The 900 KB cap forces aggressive client-side compression, which is a quality
  ceiling on exactly the images a clinician might look at.

### Target shape

```
R2 bucket: arcane-photos   (private, no public access)
  key: photos/{uid}/{photoId}.jpg

Firestore users/{uid}/photos/{id}
  imageData: null            ← dropped once migrated
  storageKey: "photos/…"     ← new
  storageBackend: "r2"       ← new; absent/"firestore" = legacy inline
```

`sharedPhotos` stores the **key**, not a second copy — killing the duplication
as a side effect.

### Access control (confirming the requirement, as asked)

**Yes — private bucket, signed URLs, short expiry. These are health images and
there must be no public bucket, no public `r2.dev` domain, and no
unauthenticated custom-domain access.** Concretely:

- Bucket has no public access and no public development URL enabled.
- Reads go through a server route that (a) authenticates the session, (b)
  authorises `uid` against the requested key, then (c) returns a presigned GET.
- **Expiry: 5 minutes.** Long enough for a page to load and for the browser to
  fetch every thumbnail on the timeline; short enough that a leaked URL in a
  screenshot, a referrer header or a chat log is dead by the time anyone reads
  it.
- Presigned URLs are generated per request and never cached in Firestore, never
  logged, and never included in exports.
- Uploads go through a presigned PUT with a content-length ceiling and a
  content-type allowlist, so the client can't stream an arbitrary blob.
- The one genuinely public surface — the community "Won" wall — should serve a
  **derived, watermarked variant** from a separate public-read prefix rather
  than presigning the original. Sharing to the wall is an explicit member
  action, so it can copy an image into that prefix at share time and delete it
  on unshare (which is what `setPhotoShared` already does with bytes today).

Please confirm the 5-minute expiry and the separate public prefix for shared
photos before implementation.

### Migrating existing photos

**Not started — needs your go-ahead, as requested.** Shape of the job:

1. **Dual-write first.** New uploads go to R2 and set `storageKey`; readers
   prefer `storageKey` and fall back to `imageData`. Ship this alone and let it
   soak — at this point nothing has been migrated and rollback is a revert.
2. **Backfill**, chunked per user, resumable, writing `storageKey` before
   clearing `imageData` so a crash mid-run never loses bytes.
3. **Verify** — count photos per user before and after; byte-compare a sample;
   confirm every `sharedPhotos` mirror resolves.
4. **Only then** clear `imageData`, in a separate run, after a soak period long
   enough to notice a problem (a week is reasonable given the photo timeline is
   not a daily-visit surface).

Volume is unknown from here — I can't query production. The backfill's cost and
duration are entirely a function of photo count, so **that number should be
checked before scheduling the run.**

### Is a clean cutover for new uploads possible?

**Yes, with one caveat that is not clean.** New uploads can go to R2 from the
moment step 1 ships, because reads already have to handle both backends during
migration anyway. The caveat: **the personal baseline in the AI grading path
reads every prior photo's `estimate.composite`, not its bytes**
(`pickBaseline` in `src/lib/photo-score.ts`), so grading is unaffected by the
storage move. The compare overlay and story picker *do* read bytes and will
need the fallback for as long as any inline photo exists.

Flagging one thing that is **not** a clean cutover: **Firestore security
rules** (`firestore.rules`) currently guard photo bytes because the bytes are
in Firestore. Move the bytes to R2 and those rules stop protecting anything —
authorisation moves entirely into the presigning route. That's a real security
boundary changing hands and wants its own review.

---

## 2. Cloudflare Images — variants for the timeline

Depends on R2 landing first; serving variants of inline base64 is not a thing.

Once photos are in R2:

| Variant | Use | Size |
|---|---|---|
| `thumb` | timeline grid (`photos-client.tsx`, `aspect-square`) | 320×320, cover |
| `compare` | compare overlay, up to 4 side by side | 800w, contain |
| `full` | detail view and clinician export | original, capped 2000w |

Today the timeline serves **full-resolution base64 for every tile** — a 40-photo
month is tens of MB on a phone. This is the single biggest performance win in
the Cloudflare list, and it's blocked behind R2.

Note that variants and signed URLs interact: Cloudflare Images' signed-URL
support is per-variant, so the 5-minute presigning above applies to each
variant URL, not to one canonical original.

---

## 3. Turnstile — **built**

- `src/lib/turnstile.ts` — server verification.
- `src/components/turnstile.tsx` — widget, script loaded on demand (not in the
  root layout — only two screens need it).
- Wired into **signup** (`src/app/api/auth/session/route.ts`, gated on the
  branch that *creates* a Postgres user row, so returning members log in
  without a challenge) and the **community post entry point**
  (`src/app/api/posts/route.ts`).

Behaviour without keys: **completely inert.** No widget renders, no
verification runs, no behaviour changes. Set both env vars to switch it on:

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=…
TURNSTILE_SECRET_KEY=…
```

Deliberate choice to flag: **a network failure reaching Cloudflare is treated
as a pass.** Bot protection is not worth an availability incident on signup.

The `/chat` page is a static WhatsApp invite link with no form, so there is
nothing to challenge there; the community post form is the real
user-generated-content entry point.

---

## 4. Worker (edge rate limiting) — **written, not deployed**

Source: `workers/ai-grade-gate/`. See its README for prerequisites.

Both controls also exist in the app layer today and work without the Worker:

- rate limit — `countPhotosSince` in `src/lib/tsw-db.ts`, called from the photo
  POST route
- non-skin gate — `isLikelySkinPhoto` in `src/lib/photo-score.ts`, run
  client-side before grading and re-checked server-side

The app-layer skin check trusts a client-supplied `skinFraction`, which is the
honest limitation: a hand-rolled request can omit it. **The Worker is what makes
that check tamper-proof**, because it decodes the image itself. Until it's
deployed, the rate limit is the control that actually bounds abuse.

---

## 5. Cache rules for static pages

**Blocked on the DNS question above.** If (and only if) traffic is proxied:

| Path | Rule |
|---|---|
| `/archives`, `/pricing`, `/legal/*`, `/` | Cache everything, edge TTL 1h, respect origin `Cache-Control` |
| `/_next/static/*` | Cache everything, 1y immutable (already immutable from Next) |
| `/api/*` | **Bypass cache — no exceptions** |
| `/dashboard`, `/tracker`, `/photos`, `/insights`, everything under `(app)` | **Bypass cache** |

The `/api/*` and `(app)/*` bypasses are not optimisations, they're safety
requirements: these responses are per-member health data and must never be
stored in a shared cache. Any cache rule work should start by writing the
bypasses, then add the allowlist.

`/archives` is worth checking before caching it — it's instrumented with funnel
events (`archives_view`) and if that fires server-side, caching would flatten
the metric.
