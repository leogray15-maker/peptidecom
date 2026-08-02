# "Generate a report for my dermatologist" — audit and scope

**Answer to the question asked: no, it does not exist.** Scoping it here rather
than building it, as instructed.

---

## What exists today

`GET /api/tsw/export?data=…` (`src/app/api/tsw/export/route.ts`) returns raw
CSV, one file per dataset, linked from Settings:

| `data=` | Contents |
|---|---|
| `logs` | date, severity, areas, symptoms, sleep, mood, note |
| `triggers` | date, kind, name, effect, note |
| `journal` | date, goal, rating, weight, note |
| `peptides` | date, peptide, dose, site, purpose, note |

That is a **data dump, not a report**. Handing a dermatologist four CSVs at a
ten-minute appointment is not a usable artifact.

## What's missing, measured against your completeness list

| Required | Status |
|---|---|
| EASI history | **Absent from every export.** EASI scores live in browser localStorage (`src/lib/tool-history.ts`) and are never persisted server-side. |
| POEM history | **Absent, same reason.** |
| Photo timeline | **Absent.** No export includes photos or references them. |
| AI-graded estimates | **Absent.** `estimate` is stored on the photo doc but never exported. |
| Disclaimer labels intact | N/A — nothing to label yet. **This is the requirement that must not be lost:** the moment estimates enter an export, every one needs the persistent label, and any embedded image needs it burned in (`src/lib/watermark.ts` already does this for single-photo downloads). |

## The blocker worth naming first

**EASI and POEM history is device-local.** A member who scored EASI on their
phone has nothing to put in a report generated on their laptop, and clearing
browser storage destroys it. Any real clinician report needs those scores
server-side first — that's a data-model change with its own consent question
(these are clinical measures; storing them server-side is a different privacy
posture from the current "stays on your device" promise made in
`/privacy-sources`), not a formatting task.

**This should be decided before the report is built**, because it determines
whether the report is a genuine clinical summary or a prettier CSV.

## Proposed scope, if you want it built

1. **Persist EASI/POEM server-side** (`users/{uid}/easiScores`,
   `users/{uid}/poemScores`), with a migration that offers to upload existing
   localStorage history on next visit, and updated privacy copy. *Prerequisite.*
2. **A single-page PDF** covering: member-selected date range; severity trend
   chart; EASI and POEM series with dates; a photo strip (3–6 photos across the
   range, each carrying the burned-in label where an estimate is attached);
   top logged triggers; and a footer stating the tool is self-tracking, that
   AI estimates are estimates, and which model version produced each one.
3. **Generation location.** Client-side (jsPDF or print-to-PDF) keeps photos off
   the server and matches the existing on-device posture; server-side gives
   better typography and a stable artifact. Recommend **client-side print
   stylesheet → browser PDF** first: no new dependency, no new data leaving the
   device, and it gets a usable artifact in front of members quickly.
4. **Every AI estimate in the PDF carries `AI_ESTIMATE_LABEL`**, and it must not
   be separable from its number — same rule as the UI and the image export.

Rough size: step 1 is the bulk of it (~2–3 days including the consent copy and
migration); steps 2–4 are ~2 days on top.

**Not started pending your decision on step 1.**
