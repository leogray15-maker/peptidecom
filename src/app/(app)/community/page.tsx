import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { safe } from "@/lib/safe-db";
import { Avatar } from "@/components/avatar";
import { timeAgo } from "@/lib/utils";
import { NewPostForm } from "@/components/new-post-form";
import { Pin, MessageSquare, ArrowBigUp } from "lucide-react";

export const metadata = { title: "Community" };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const getPosts = () =>
    prisma.post.findMany({
      where: cat ? { category: { slug: cat } } : undefined,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        author: true,
        category: true,
        _count: { select: { comments: true, votes: true } },
        votes: { select: { value: true } },
      },
    });
  const getCategories = () => prisma.category.findMany({ orderBy: { order: "asc" } });
  const posts = await safe(getPosts, [] as Awaited<ReturnType<typeof getPosts>>);
  const categories = await safe(getCategories, [] as Awaited<ReturnType<typeof getCategories>>);

  return (
    <div>
      <PageHeader
        title="Community"
        subtitle="Honest, moderated discussion. Find people in the same phase as you — they get it."
      />

      <NewPostForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />

      {/* Filter by group — recovery stages first, so members match with their phase */}
      {categories.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          <Link
            href="/community"
            className={
              !cat
                ? "badge bg-brand-500/20 text-brand-200"
                : "badge border border-lab-border text-slate-400 hover:text-slate-200"
            }
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/community?cat=${c.slug}`}
              className={
                cat === c.slug
                  ? "badge bg-brand-500/20 text-brand-200"
                  : "badge border border-lab-border text-slate-400 hover:text-slate-200"
              }
            >
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {posts.length === 0 ? (
          <div className="card text-sm text-slate-400">
            No posts yet — start the first discussion above.
          </div>
        ) : (
          posts.map((post) => {
            const score = post.votes.reduce((s, v) => s + v.value, 0);
            return (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="card flex gap-4 transition hover:border-brand-600"
              >
                <div className="flex flex-col items-center justify-center rounded-xl bg-lab-bg px-3 py-2 text-center">
                  <ArrowBigUp className="h-4 w-4 text-brand-300" />
                  <span className="text-sm font-semibold text-white">{score}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {post.pinned && <Pin className="h-3.5 w-3.5 text-amber-300" />}
                    <span className="badge bg-brand-900/60 text-brand-200">
                      {post.category?.name ?? "General"}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate font-semibold text-white">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">{post.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Avatar name={post.author.name} image={post.author.image} className="h-5 w-5 text-[9px]" />
                      {post.author.name}
                    </span>
                    <span>{timeAgo(post.createdAt)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> {post._count.comments}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
