# Curated testimonial images

Files in this folder are served publicly at `/testimonials/<filename>` and are
referenced by hand from [`src/lib/testimonials.ts`](../../src/lib/testimonials.ts).

## Adding a testimonial

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

Any file that is missing renders as a labelled placeholder rather than a broken
image, so the page stays presentable until the picture is dropped in.

## Conventions

- **Format**: JPEG for photos and screenshots. Keep each file under ~400 KB —
  these load on the landing page.
- **Size**: 1080px on the long edge is plenty. Progress photos are cropped to a
  square tile in the grid, so keep the subject centred; images marked
  `kind: "screenshot"` are shown uncropped.
- **Naming**: `<firstname>-<what-it-shows>.jpg`, lowercase, hyphenated.
- **Privacy**: first names only, and no faces or identifying detail unless the
  person explicitly agreed to that too.
