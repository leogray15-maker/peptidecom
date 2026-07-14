import { StoriesPanel, type AdminStory } from "@/components/admin/stories-panel";
import { safe } from "@/lib/safe-db";
import { type RecoveryStory, getPhotosByIds, listStories } from "@/lib/tsw-db";

export const metadata = { title: "Stories" };

/** Content flywheel: triage submitted recovery stories, check consent at a
 * glance, and turn a consented story into a ready-to-post quote card. */
export default async function AdminStoriesPage() {
  const stories = await safe(() => listStories(200), [] as RecoveryStory[]);

  // Resolve consented before/after photos (and only those — photo ids are
  // stored on the story solely when the member opted in).
  const photoUrls = new Map<string, { before?: string; after?: string }>();
  await Promise.all(
    stories
      .filter((s) => s.photoConsent && (s.beforePhotoId || s.afterPhotoId))
      .map(async (s) => {
        const ids = [s.beforePhotoId, s.afterPhotoId].filter((x): x is string => !!x);
        const photos = await getPhotosByIds(s.uid, ids).catch(() => []);
        photoUrls.set(s.id, {
          before: photos.find((p) => p.id === s.beforePhotoId)?.imageData,
          after: photos.find((p) => p.id === s.afterPhotoId)?.imageData,
        });
      })
  );

  const items: AdminStory[] = stories.map((s) => ({
    id: s.id,
    title: s.title,
    body: s.body,
    prompts: s.prompts ?? null,
    authorName: s.authorName,
    monthsIn: s.monthsIn,
    condition: s.condition ?? "tsw",
    createdAt: s.createdAt,
    marketingConsent: s.marketingConsent === true,
    marketingConsentAt: s.marketingConsentAt ?? null,
    photoConsent: s.photoConsent === true,
    status: s.status ?? "new",
    postedAt: s.postedAt ?? null,
    beforeUrl: photoUrls.get(s.id)?.before ?? null,
    afterUrl: photoUrls.get(s.id)?.after ?? null,
  }));

  const daysSinceLast =
    stories.length > 0
      ? Math.floor((Date.now() - new Date(stories[0].createdAt).getTime()) / 86_400_000)
      : null;

  return <StoriesPanel stories={items} daysSinceLast={daysSinceLast} />;
}
