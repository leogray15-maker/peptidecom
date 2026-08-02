# Data import (EczemaWise migration) — scope only

**Nothing built.** As requested, this is the pipeline design and the schema
mismatches, not an implementation.

---

## Target data model

Imports land in `users/{uid}/dailyLogs/{YYYY-MM-DD}` (`DailyLog` in
`src/lib/tsw.ts`) and `users/{uid}/triggerLogs/{id}` (`TriggerLog` in
`src/lib/tsw-db.ts`).

```ts
DailyLog {
  date: string          // YYYY-MM-DD — also the document id
  areas: string[]       // ids from ALL_ZONE_IDS
  severity: number      // 1–10, required
  symptoms: string[]    // ids from ALL_SYMPTOM_IDS
  sleep: number | null  // 1–5
  mood: number | null   // 1–5
  note?: string | null
  loggedOn?: string     // set by saveLog; see the grace-day note below
}
```

POEM scores are **not** in Firestore at all — `src/lib/tool-history.ts` keeps
them in browser localStorage. That's a real gap for an importer: a member
bringing POEM history has nowhere durable to put it. **Decision needed:**
either add a Firestore `poemScores` collection as part of import work, or drop
POEM history on import and say so plainly in the preview.

---

## Pipeline

```
upload → parse → map → validate → PREVIEW → confirm → dedupe → write → report
```

1. **Upload** — accept CSV and JSON. Cap file size; parse server-side (a
   50 MB CSV should not be parsed in a phone's main thread).
2. **Parse** — CSV with quoted fields and CRLF; the existing `toCsv` in
   `src/app/api/tsw/export/route.ts` shows the dialect we emit, and an importer
   should round-trip our own export as a baseline test.
3. **Map** — a declarative column map per source app, so adding a second source
   is a config entry rather than a code path. Unrecognised columns are surfaced
   in the preview as "not imported", never silently dropped.
4. **Validate** — same Zod schema as `POST /api/tsw/log`. Rows that fail are
   listed individually with their line number; a bad row must never abort a
   good file.
5. **Preview and confirm** — **required, per your instruction.** Shows: rows
   parsed, rows valid, rows that would create a new log, rows that would
   collide with an existing log, rows dropped and why, and the date range. No
   write happens before an explicit confirm.
6. **Dedupe** — **required, per your instruction.** See below.
7. **Write** — batched, resumable, idempotent per date.
8. **Report** — what was written, skipped, and merged.

---

## Schema mismatches to handle

### Severity scale

Ours is **1–10**. EczemaWise-style trackers commonly use 0–4 or 0–10 bands, and
POEM-derived severity is 0–28. A 0-valued severity has no representation in our
model at all — `severity` is `min(1)`.

Rescaling is lossy in a way members will notice: a 0–4 scale maps to five
distinct values across a ten-point range, so an imported history will look
"steppy" next to native logs, and any correlation computed across the boundary
mixes two different instruments. **Recommendation: store an
`importedScale` marker on imported logs and exclude them from
`computePersonalInsight` until the member has enough native data**, rather than
pretending the two scales are the same measurement.

### Timezone and dates

`DailyLog.date` is a **local** date key (`dateKey()` uses the runtime's local
timezone), and the doc id *is* the date. An export from another app may carry
UTC timestamps, ISO datetimes, or ambiguous `MM/DD/YYYY` vs `DD/MM/YYYY`.

- Ask the member for their timezone at import (or take the browser's), and
  convert to local dates in that zone — not the server's.
- Ambiguous date formats must be resolved in the preview (show the first few
  parsed dates back: "we read 03/04/2026 as 3 April — correct?"), not guessed.
- An entry at 00:30 UTC is the previous day in the Americas. Getting this wrong
  shifts a member's whole history by one day and silently breaks every
  next-day lag in the insights engine.

### Symptoms, zones and triggers

Ours are fixed id sets (`ALL_SYMPTOM_IDS`, `ALL_ZONE_IDS`). Source apps use
free text or their own taxonomies. Needs a mapping table plus an
"unmapped → note" fallback, so nothing is lost even when it can't be
structured. Trigger *names* are free text on our side, so those import cleanly.

### The grace-day interaction (easy to miss)

`saveLog` sets `loggedOn` to the server date of first write, and the flare-day
grace pass requires `loggedOn === date` (`wasLoggedSameDay`). **An import must
set `loggedOn` to the original entry date if and only if the source records
one, and otherwise leave it non-same-day** — otherwise importing a year of
history hands the member a year of retroactive grace passes and inflates a
streak they didn't earn.

---

## Deduplication requirement

Dates are document ids, so a naive write is a silent overwrite. Rules:

- **Existing log wins by default.** Native data is not replaced by imported
  data without an explicit per-collision choice.
- The preview lists collisions with both versions side by side, and offers
  three options for the whole run: skip colliding dates, overwrite them, or
  merge field-by-field (fill only fields that are empty locally).
- Trigger logs have no natural key, so dedupe on
  `(date, kind, normalised name)` and drop exact repeats.
- Re-running the same file must be a no-op. Store an import receipt
  (`users/{uid}/imports/{id}` with a content hash) so a double-tap or a retry
  after a timeout can't double-write.

---

## Estimated shape of the build

Roughly, once the decisions above are made: parser and column mapping ~1 day,
validation and preview UI ~2 days, dedupe and write path with receipts ~1 day,
tests across the scale/timezone edge cases ~1 day. The POEM-storage decision is
the one that can expand the scope, because it means new Firestore collections
and new read paths, not just an importer.
