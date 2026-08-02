import "server-only";
import { safe } from "@/lib/safe-db";
import {
  type PublicTestimonial,
  curatedTestimonials,
  storyToPublicTestimonial,
} from "@/lib/testimonials";
import { type RecoveryStory, getPhotosByIds, listFeaturedStories } from "@/lib/tsw-db";

/** Resolve a featured story's before/after into data-URLs.
 *
 * Two routes in: photos uploaded with the story (already data-URLs), or photos
 * picked from the member's timeline (ids that need fetching). Either way this
 * only runs when the member ticked photo consent — an unconsented story goes
 * public as words alone, never pictures. */
async function withImages(story: RecoveryStory): Promise<RecoveryStory> {
  if (story.photoConsent !== true) return story;
  if (story.beforeImage && story.afterImage) return story;
  if (!story.beforePhotoId || !story.afterPhotoId) return story;

  const photos = await safe(
    () => getPhotosByIds(story.uid, [story.beforePhotoId!, story.afterPhotoId!]),
    []
  );
  return {
    ...story,
    beforeImage: photos.find((p) => p.id === story.beforePhotoId)?.imageData ?? null,
    afterImage: photos.find((p) => p.id === story.afterPhotoId)?.imageData ?? null,
  };
}

/** The public wall: hand-curated testimonials first, then member stories an
 * admin has featured. Never throws — a missing or unreachable database just
 * means the curated entries render on their own. */
export async function getPublicTestimonials(limit = 12): Promise<PublicTestimonial[]> {
  const stories = await safe(() => listFeaturedStories(limit), [] as RecoveryStory[]);
  const resolved = await Promise.all(stories.map(withImages));
  const fromMembers = resolved
    .map(storyToPublicTestimonial)
    .filter((t): t is PublicTestimonial => t !== null);

  return [...curatedTestimonials(), ...fromMembers];
}
