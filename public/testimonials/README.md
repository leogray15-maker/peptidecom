# Curated testimonial images

> **You probably don't need this folder any more.** The admin CRM's
> **Proof wall** (`/admin/proof`) lets you upload a testimonial's photos
> straight into the app, and those take precedence over anything here. Use it
> unless you specifically want the images committed to the repo.

Files in this folder are served publicly at `/testimonials/<filename>` and are
referenced by hand from [`src/lib/testimonials.ts`](../../src/lib/testimonials.ts).

## The two routes in

| Route | Where the photo lives | When to use it |
| --- | --- | --- |
| **Proof wall** (`/admin/proof`) | Firestore, as a compressed data-URL | Almost always — no deploy, and the CRM records who approved it |
| **This folder** | The repo, under `/public` | When you want the image version-controlled alongside the quote |

If an entry in `TESTIMONIALS` has photos uploaded through the Proof wall, those
replace the file paths below entirely. That is also the fix when the paths
listed here point at files that were never added: upload the pictures in the
CRM instead of committing them.

## Adding a testimonial the file way

1. Save the image files here using the filenames listed in `src/lib/testimonials.ts`
   for that person.
2. Add (or update) the entry in `TESTIMONIALS` with their quote, condition,
   timeframe and the `consentedAt` date they gave permission to publish.

Only add someone here once they have actually said yes to their words and
photos being used publicly — `consentedAt` exists so that permission is a
record rather than a memory.

## Files expected right now

| File | What it shows |
| --- | --- |
| `daniel-hand-knuckles.jpg` | Knuckles & thumb — day 1 vs. day 4 |
| `daniel-hand-back.jpg` | Back of the hand — day 1 vs. day 4 |
| `daniel-hand-web.jpg` | Thumb web — day 1 vs. day 4 |
| `daniel-torso.jpg` | Chest & torso — day 1 vs. day 4 |
| `daniel-message.jpg` | Screenshot of Daniel's message |

These files are **not** in the repo. Until they're added — or the photos are
uploaded on the Proof wall — that testimonial renders as words alone: a tile
whose image 404s degrades to a labelled placeholder, and a gallery where every
image failed removes itself rather than showing a grid of grey boxes. The Proof
wall flags this under "Missing photos".

## Conventions

- **Format**: JPEG for photos and screenshots. Keep each file under ~400 KB —
  these load on the landing page.
- **Size**: 1080px on the long edge is plenty. Progress photos are cropped to a
  square tile in the grid, so keep the subject centred; images marked
  `kind: "screenshot"` are shown uncropped.
- **Naming**: `<firstname>-<what-it-shows>.jpg`, lowercase, hyphenated.
- **Privacy**: first names only, and no faces or identifying detail unless the
  person explicitly agreed to that too.
