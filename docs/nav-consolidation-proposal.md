# Sidebar consolidation — proposal (NOT executed)

You asked for a proposal and an estimate, and said not to execute without
confirming. **No navigation changes have been made.**

---

## The overlap

Current `NAV_SECTIONS` (`src/components/app-nav.tsx`), "Recovery" section:

| Item | Route | What it actually is |
|---|---|---|
| Daily tracker | `/tracker` | Data entry |
| Photo timeline | `/photos` | Data entry + history |
| Where am I? | `/timeline` | Stage self-assessment + stage reference |
| Insights | `/insights` | Charts from logged data |
| Triggers | `/triggers` | Data entry + per-trigger history |
| Flare-day support | `/support` | Static coping content + links out |

Four of these answer "what is my data telling me?" from different doors, and a
member has no way to guess which door holds which answer. "Where am I?" and
"Insights" are the worst pair — both are retrospective views of the same logs.

## Proposed structure

```
Track          → /tracker   (daily log)
                 /photos    (photo timeline)
                 /triggers  (trigger log)

Insights       → /insights           tabs: Trends · Patterns · Where am I
                 (existing /insights, /timeline fold in as tabs)

Support        → /support   (unchanged, promoted out of "Recovery")

Skin tools     → unchanged, but split VALIDATED / EXPERIMENTAL to match the
                 dashboard change already made in this branch
```

Rationale: the top-level split becomes **put data in / get data out / get
help**, which is a distinction a member can hold in their head. "Where am I?"
becomes a tab rather than a destination, because it is a reading of the data,
not a separate activity.

## Rework estimate

| Work | Size |
|---|---|
| `NAV_SECTIONS` restructure + `mobile-nav.tsx` | ~1h |
| Tabbed shell for `/insights` (new client component, URL-synced tab state so links and back-button work) | ~3h |
| Fold `/timeline` into a tab — it's a full page with its own client component and POST to `/api/tsw/stage`; becomes a tab panel | ~3h |
| Redirects from `/timeline` → `/insights?tab=where-am-i` (there are inbound links from the dashboard, `feature-card` grid, and stage sheet) | ~1h |
| Update every internal link and the `StageSheet` "Change where I am" button | ~1h |
| Re-check active-state highlighting (`navItemClass` matches on `startsWith`, which will behave differently once routes nest) | ~1h |

**~10 hours, one to two days with testing.**

## Risks worth weighing before saying yes

- **It changes the IA members already learned.** Anyone with `/timeline`
  bookmarked, or muscle memory for the sidebar, is relocated. Redirects handle
  the URL; they don't handle the habit.
- **`/timeline` is the only place a stage can be set**, and stage feeds the
  cohort statistics (`stageEvents` → `buildCohortStatements`). Burying it one
  level deeper will reduce stage marking, which degrades a community feature
  for everyone, not just the member who stopped marking. Worth instrumenting
  the current stage-set rate *before* the move so the effect is measurable.
- The dashboard's stage card now opens the new `StageSheet`, which already
  removes part of the reason to visit `/timeline` at all. **It may be worth
  shipping that and measuring before restructuring anything** — the cheaper
  change might resolve enough of the confusion.

**Recommendation: hold.** Ship the dashboard changes in this branch, watch
whether `/timeline` and `/insights` traffic separates once the stage sheet
exists, then decide. Happy to execute the above on your word.
