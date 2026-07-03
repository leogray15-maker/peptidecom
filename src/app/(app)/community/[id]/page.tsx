import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { timeAgo } from "@/lib/utils";
import { VoteButton } from "@/components/vote-button";
import { CommentForm } from "@/components/comment-form";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      category: true,
      votes: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: true },
      },
    },
  });

  if (!post) notFound();

  const score = post.votes.reduce((s, v) => s + v.value, 0);
  const myVote = user ? post.votes.find((v) => v.userId === user.id)?.value ?? 0 : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/community" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to community
      </Link>

      <article className="card">
        <div className="flex gap-4">
          <VoteButton postId={post.id} initialScore={score} initialVote={myVote} />
          <div className="min-w-0 flex-1">
            <span className="badge bg-brand-900/60 text-brand-200">
              {post.category?.name ?? "General"}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-white">{post.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <Avatar name={post.author.name} image={post.author.image} className="h-6 w-6 text-[10px]" />
              <span>{post.author.name}</span>
              <span>· {timeAgo(post.createdAt)}</span>
            </div>
            <div className="mt-4 whitespace-pre-wrap text-slate-200">{post.content}</div>
          </div>
        </div>
      </article>

      <h2 className="mt-8 text-lg font-semibold text-white">
        {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
      </h2>

      <div className="mt-4">
        <CommentForm postId={post.id} />
      </div>

      <div className="mt-6 space-y-4">
        {post.comments.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Avatar name={c.author.name} image={c.author.image} className="h-6 w-6 text-[10px]" />
              <span className="font-medium text-slate-300">{c.author.name}</span>
              <span>· {timeAgo(c.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
