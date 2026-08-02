# Weekly digest — delivery infrastructure (separate task)

The digest **payload generation** is built and scheduled. **Delivery is not**,
because no notification transport exists in this repo.

## What is built

| Piece | Where |
|---|---|
| Payload generation (reuses the dashboard's pattern engine) | `src/lib/digest.ts` |
| Weekly run over all members | `src/lib/digest-db.ts` → `runDigest()` |
| Cron entry, Mondays 09:00 UTC | `vercel.json` → `/api/cron/digest` |
| Opt-in + quiet hours model | `src/lib/notifications.ts` |
| Member-facing prefs UI | `src/components/digest-prefs-client.tsx` (Settings) |
| Prefs API | `/api/tsw/digest-prefs` |
| Tests | `scripts/digest.test.ts` (16 assertions) |

Payloads are written to `users/{uid}/digests/{weekEnding}` with a `pushState`
of `ready`, `deferred` or `in-app-only`. **Nothing is sent.**

## Consent and quiet hours — already enforced

- **Push is opt-in only.** `enabled` defaults to `false`; a member who never
  opted in has no payload generated at all, not one quietly withheld. The job
  exits before reading their logs, so it also costs nothing for most accounts.
- **In-app surfacing is separate** from push and defaults on — it's a card in
  the app the member chose to open, not an interruption.
- **Quiet hours defer, they don't drop.** A digest landing at 02:00 local is
  marked `deferred` with a `pushDeferredUntil` timestamp at the end of the
  window. Overnight windows that wrap midnight are handled, and the window is
  evaluated in the **member's** timezone via a stored UTC offset.

## What a transport still needs

1. **Pick one.** Web Push (VAPID, works on iOS 16.4+ as an installed PWA),
   FCM, or email. Web Push has no per-message cost and no vendor account, which
   matches the cost posture of the rest of this codebase.
2. **Subscription storage** — `users/{uid}/pushSubscriptions/{id}` with the
   endpoint and keys, plus pruning on 410 Gone.
3. **A permission prompt.** The browser prompt must be requested from a user
   gesture, and should be asked for *after* the member flips the toggle in
   Settings — never on page load. Note the toggle currently records intent
   without a browser subscription; wiring the transport means the toggle also
   has to trigger (and can fail) the permission request.
4. **A deferred-send sweep.** Quiet-hours deferrals need an hourly job that
   picks up `pushState: "deferred"` rows whose `pushDeferredUntil` has passed.
   The weekly cron alone will not deliver them.
5. **An unsubscribe path that doesn't require opening the app**, for app store
   and CAN-SPAM/GDPR reasons if email is chosen.

Estimated ~2 days for Web Push including the sweep job and subscription
lifecycle.
