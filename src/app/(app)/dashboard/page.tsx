import Link from "next/link";
import {
  Calculator,
  LineChart,
  MessageSquare,
  Store,
  FlaskConical,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const quickLinks = [
  { href: "/calculator", label: "Reconstitution calculator", icon: Calculator, desc: "Work out your syringe units." },
  { href: "/progress", label: "Log progress", icon: LineChart, desc: "Track weight & measurements." },
  { href: "/vendors", label: "Browse vendors", icon: Store, desc: "Verified vendors & reviews." },
  { href: "/lab-tests", label: "Lab tests", icon: FlaskConical, desc: "Purity & COA library." },
  { href: "/group-buys", label: "Group buys", icon: PackageCheck, desc: "Join or start a buy." },
  { href: "/community", label: "Community", icon: MessageSquare, desc: "Latest discussion." },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const [recentPosts, memberCount, testCount] = await Promise.all([
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: true, category: true, _count: { select: { comments: true } } },
    }),
    prisma.user.count(),
    prisma.labResult.count(),
  ]);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Here's what's happening in the lab today."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-400">Members</p>
          <p className="mt-1 text-3xl font-bold text-white">{memberCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Lab tests on file</p>
          <p className="mt-1 text-3xl font-bold text-white">{testCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Your reputation</p>
          <p className="mt-1 text-3xl font-bold text-white">{user?.reputation ?? 0}</p>
        </div>
      </div>

      {/* Quick links */}
      <h2 className="mt-8 text-lg font-semibold text-white">Jump back in</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((l) => (
          <Link key={l.href} href={l.href} className="card group transition hover:border-brand-600">
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-900/60 text-brand-300">
                <l.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:text-brand-300" />
            </div>
            <p className="mt-4 font-semibold text-white">{l.label}</p>
            <p className="mt-1 text-sm text-slate-400">{l.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent discussion */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Latest discussion</h2>
        <Link href="/community" className="text-sm font-medium text-brand-300 hover:text-brand-200">
          View all
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {recentPosts.length === 0 ? (
          <div className="card text-sm text-slate-400">
            No posts yet. Be the first to{" "}
            <Link href="/community" className="text-brand-300 hover:text-brand-200">
              start a discussion
            </Link>
            .
          </div>
        ) : (
          recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="card flex items-center justify-between transition hover:border-brand-600"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{post.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {post.category?.name ?? "General"} · {post.author.name} · {timeAgo(post.createdAt)}
                </p>
              </div>
              <span className="ml-4 shrink-0 text-sm text-slate-400">
                {post._count.comments} 💬
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
