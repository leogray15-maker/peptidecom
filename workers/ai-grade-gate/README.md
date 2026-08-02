# ai-grade-gate — edge gate for flare-photo submissions

**Status: written, not deployed.** Nothing in the running app depends on it.

Sits in front of `POST /api/tsw/photos` and enforces, at the edge:

- **Per-user rate limiting** — 40 submissions/hour, in a Durable Object counter
  keyed by a hash of the session cookie. Mirrors `PHOTO_RATE_LIMIT` in
  `src/lib/ai-grading.ts`.
- **Non-skin rejection** — decodes the submitted image through Cloudflare
  Images and runs the same skin-fraction heuristic the browser runs, somewhere
  the member can't tamper with it. Mirrors `MIN_SKIN_FRACTION`.

The app-layer versions of both checks stay in place. This Worker makes them
cheaper (a rejected request never costs a Vercel invocation or a Firestore
read), not redundant — the origin must never assume the gate ran.

## Why it isn't deployed

Three prerequisites, none of which are in place; the first is a decision, not a
task. See `docs/cloudflare-scope.md`.

1. The apex domain must be proxied through Cloudflare. **Current DNS/proxy
   status is unconfirmed** — the app deploys to Vercel and nothing in the repo
   references Cloudflare.
2. `GATE_SECRET` must be set as a Wrangler secret and as `ARCANE_GATE_SECRET`
   on Vercel, and the origin route should then reject requests lacking the
   header (currently it doesn't check, because the gate isn't there).
3. Cloudflare Images must be enabled on the zone for the decode path.

## Local development

```
npm install -D @cloudflare/workers-types wrangler   # inside this directory
npx tsc --noEmit                                     # uses this dir's tsconfig
npx wrangler dev
```

This directory is excluded from the root `tsconfig.json` — it targets the
Workers runtime, and its type packages are not installed in the app.

## Keeping the constants in sync

`RATE_LIMIT`, `MIN_SKIN_FRACTION` and `computeSkinFraction` are deliberate
duplicates of the app-side values (a Worker can't import from `src/`). If you
change one, change both — `scripts/ai-grading.test.ts` covers the app side.
