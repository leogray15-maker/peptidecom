import "server-only";
import type { Prisma } from "@prisma/client";
import { normalizePhone } from "@/lib/phone";

/** Shared customer query builder so the table and the CSV export always agree
 * on what "the current view" means. */

export interface CustomerQueryParams {
  q?: string;
  status?: string;
  role?: string;
  tag?: string;
  sort?: string;
}

export function customerWhere(p: CustomerQueryParams): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];

  const q = p.q?.trim();
  if (q) {
    const or: Prisma.UserWhereInput[] = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];

    // Phone search, matched however it was typed: numbers are stored in E.164,
    // so "07700 900123", "+44 7700 900123" and "900123" all have to find the
    // same person.
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 4) {
      const normalized = normalizePhone(q);
      if (normalized) or.push({ phone: normalized });
      // Trailing digits: the end of a number is what an admin remembers, and
      // it's the part that doesn't change with the country code.
      or.push({ phone: { endsWith: digits.replace(/^0+/, "") } });
    }

    and.push({ OR: or });
  }

  switch (p.status) {
    case "member":
      and.push({ subscriptionStatus: { in: ["ACTIVE", "TRIALING"] } });
      break;
    case "trialing":
      and.push({ subscriptionStatus: "TRIALING" });
      break;
    case "past_due":
      and.push({ subscriptionStatus: "PAST_DUE" });
      break;
    case "canceled":
      and.push({ subscriptionStatus: "CANCELED" });
      break;
    case "free":
      and.push({ subscriptionStatus: { in: ["NONE", "INCOMPLETE"] } });
      break;
    case "founding":
      and.push({ foundingMember: true });
      break;
  }

  if (p.role === "ADMIN" || p.role === "MODERATOR" || p.role === "MEMBER") {
    and.push({ role: p.role });
  }

  if (p.tag?.trim()) {
    and.push({ crmTags: { has: p.tag.trim() } });
  }

  return and.length ? { AND: and } : {};
}

export function customerOrderBy(sort?: string): Prisma.UserOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name":
      return { name: "asc" };
    case "reputation":
      return { reputation: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

/** Normalize Next's searchParams values (string | string[] | undefined). */
export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
