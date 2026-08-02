# "Today is bad?" → community routing — note (NOT built)

You asked what a lightweight "connect now" affordance would take, and said not
to build peer matching without confirming scope. **Nothing built.**

## What's wired today

The dashboard's "Today is bad?" card links to `/support`
(`src/app/(app)/dashboard/page.tsx`). `/support` is a static page: breathing
exercise, four coping cards, then three outbound links —

| Link | Destination |
|---|---|
| WhatsApp chat | `/chat` → a **static group invite link** |
| Read the Won wall | `/won` |
| Protocols | `/protocols` |

**So: it routes to generic community, not anything targeted.** The WhatsApp
link is the same group invite for every member, on every day, in every state.
Nobody on the other side knows the person arriving is mid-flare.

## What a lightweight "connect now" would take

Two options, in increasing order of scope.

**(a) Context-carrying entry — small.** Keep the same destinations, but let the
member arrive with context they chose to share: a one-tap "post this to the
community as a flare-day check-in" that pre-fills a post
(`NewPostForm` already exists) with a soft template, tagged so it's visible on
the community index as needing a reply. Roughly half a day. No matching, no new
data model beyond a `flareDayCheckIn` boolean on `Post`.

**(b) Reply-nudge loop — medium.** (a), plus a signal to members who've opted
in to "I'll try to answer flare-day posts", so a check-in reliably gets a human
reply rather than sitting at zero comments — which would be worse than not
offering it. Needs an opt-in list, a notification path (**which doesn't exist —
see `docs/digest-delivery.md`**), and moderation thinking about what happens
when a check-in describes a crisis. ~3–4 days, and it has a duty-of-care
dimension that isn't purely engineering.

**Full peer matching** (pairing members by stage, condition, timezone) is a
different product with safety, moderation and abuse-reporting requirements
attached. Not scoped here, per your instruction.

## The thing I'd flag regardless of scope

`/support` already ends with a crisis-line note, which is right. **If a
"connect now" affordance ships, that note needs to be more prominent than the
connect button, not below it** — the moment the product invites someone in
distress to reach out, it takes on responsibility for where that reach lands.
