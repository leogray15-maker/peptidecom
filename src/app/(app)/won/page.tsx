import Link from "next/link";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { StoryForm } from "@/components/story-form";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_CONDITION, conditionLabel, getCondition } from "@/lib/conditions";
import { safe } from "@/lib/safe-db";
import { zoneLabel } from "@/lib/tsw";
import {
  type RecoveryStory,
  type SharedPhoto,
  type TswProfile,
  getProfile,
  listSharedPhotos,
  listStories,
  tswKey,
} from "@/lib/tsw-db";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata = { title: "Won — recovery stories" };

export default async function WonPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string; share?: string }>;
}) {
  const { all, share } = await searchParams;
  const user = await getCurrentUser();
  const [allStories, sharedPhotos, profile] = await Promise.all([
    safe(() => listStories(), [] as RecoveryStory[]),
    safe(() => listSharedPhotos(12), [] as SharedPhoto[]),
    user ? safe(() => getProfile(tswKey(user)), {} as TswProfile) : ({} as TswProfile),
  ]);

  // Default to stories from the member's own condition; "?all=1" shows every
  // journey (plenty transfers: sleep, stress, patience).
  const myCondition = getCondition(profile.condition).id;
  const showAll = all === "1";
  const stories = showAll
    ? allStories
    : allStories.filter((s) => (s.condition ?? DEFAULT_CONDITION) === myCondition);

  return (
    <div>
      <PageHeader
        title="Won"
        subtitle="Recovery stories from members further down the road. On your worst day, this page is the proof."
        action={<StoryForm autoOpen={share === "1"} />}
      />

      {/* Condition filter */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        <Link
          href="/won"
          className={
            !showAll
              ? "badge bg-brand-500/20 text-brand-200"
              : "badge border border-lab-border text-slate-400 hover:text-slate-200"
          }
        >
          {conditionLabel(myCondition)}
        </Link>
        <Link
          href="/won?all=1"
          className={
            showAll
              ? "badge bg-brand-500/20 text-brand-200"
              : "badge border border-lab-border text-slate-400 hover:text-slate-200"
          }
        >
          All conditions
        </Link>
      </div>

      {/* Shared progress photos */}
      {sharedPhotos.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">
            Progress, shared by members
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {sharedPhotos.map((p) => (
              <figure key={p.id} className="card overflow-hidden !p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageData}
                  alt={p.caption ?? "Member progress photo"}
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="p-2 text-[11px] text-slate-500">
                  {formatDate(p.takenAt)}
                  {p.area ? ` · ${zoneLabel(p.area)}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* Stories */}
      {stories.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-center">
          <Trophy className="h-10 w-10 text-gold-400" />
          <p className="mt-4 font-semibold text-white">
            {!showAll && allStories.length > 0
              ? `No ${conditionLabel(myCondition)} stories yet.`
              : "The wall is waiting for its first story."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            {!showAll && allStories.length > 0 ? (
              <>
                There are stories from other conditions on the wall — much of what carries
                people through transfers. Try &ldquo;All conditions&rdquo; above.
              </>
            ) : (
              <>
                If you&apos;re further along — even just past your first hard stretch — your story
                is someone else&apos;s lifeline. Share what you wish you&apos;d been able to read.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((s) => (
            <article key={s.id} className="card border-l-4 border-l-gold-500/60">
              <div className="flex flex-wrap items-center gap-2">
                <Trophy className="h-4 w-4 text-gold-400" />
                <h2 className="font-semibold text-white">{s.title}</h2>
                {s.monthsIn != null && (
                  <span className="badge bg-gold-500/15 text-gold-300">{s.monthsIn} months in</span>
                )}
                {showAll && (
                  <span className="badge border border-lab-border text-slate-400">
                    {conditionLabel(s.condition ?? DEFAULT_CONDITION)}
                  </span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">{s.body}</p>
              {s.prompts && (
                <dl className="mt-4 space-y-2.5 border-l-2 border-lab-border pl-4">
                  {(
                    [
                      ["What was the hardest part?", s.prompts.hardest],
                      ["What changed?", s.prompts.changed],
                      ["What would you tell someone at the start?", s.prompts.advice],
                    ] as const
                  )
                    .filter(([, a]) => a)
                    .map(([q, a]) => (
                      <div key={q}>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{q}</dt>
                        <dd className="mt-0.5 text-sm text-slate-300">{a}</dd>
                      </div>
                    ))}
                </dl>
              )}
              <p className="mt-3 text-xs text-slate-500">
                {s.authorName ?? "A member"} · {timeAgo(s.createdAt)}
              </p>
            </article>
          ))}
        </div>
      )}

      <PeerSupportNote />
    </div>
  );
}
