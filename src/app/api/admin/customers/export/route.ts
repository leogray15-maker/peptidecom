import { prisma } from "@/lib/prisma";
import { lifecycleStage, logActivity, requireAdminApi } from "@/lib/admin";
import { customerOrderBy, customerWhere } from "@/lib/admin-customers";

export const runtime = "nodejs";

function csvCell(value: string | number | boolean | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Export the current customers view (same filters as the table) as CSV. */
export async function GET(req: Request) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const sp = new URL(req.url).searchParams;
  const params = {
    q: sp.get("q") ?? undefined,
    status: sp.get("status") ?? undefined,
    role: sp.get("role") ?? undefined,
    tag: sp.get("tag") ?? undefined,
    sort: sp.get("sort") ?? undefined,
  };

  const users = await prisma.user.findMany({
    where: customerWhere(params),
    orderBy: customerOrderBy(params.sort),
    take: 10000,
    include: { _count: { select: { posts: true, comments: true } } },
  });

  const header = [
    "id",
    "name",
    "email",
    "username",
    "role",
    "stage",
    "subscription_status",
    "founding_member",
    "verified",
    "tags",
    "reputation",
    "posts",
    "comments",
    "stripe_customer_id",
    "last_contacted_at",
    "joined_at",
  ];
  const lines = [header.join(",")];
  for (const u of users) {
    lines.push(
      [
        u.id,
        u.name,
        u.email,
        u.username,
        u.role,
        lifecycleStage(u),
        u.subscriptionStatus,
        u.foundingMember,
        u.verified,
        u.crmTags.join("; "),
        u.reputation,
        u._count.posts,
        u._count.comments,
        u.stripeCustomerId,
        u.lastContactedAt?.toISOString() ?? "",
        u.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(",")
    );
  }

  await logActivity({
    actorEmail: admin.email,
    action: "customers.exported",
    detail: `${users.length} rows`,
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${date}.csv"`,
    },
  });
}
