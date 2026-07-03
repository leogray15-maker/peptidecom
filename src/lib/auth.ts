import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Role, SubscriptionStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      username?: string | null;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error augmenting token
        token.role = user.role;
        // @ts-expect-error augmenting token
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? "MEMBER";
        session.user.username = (token.username as string | null) ?? null;
      }
      return session;
    },
  },
});

/** Statuses that grant access to gated content. */
const ACTIVE: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

/** Next.js uses thrown errors for control flow (redirect, notFound, dynamic
 * rendering). These must never be swallowed by a catch block or the build breaks. */
function isNextControlFlowError(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("digest" in err)) return false;
  const digest = (err as { digest?: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest === "DYNAMIC_SERVER_USAGE" ||
      digest.startsWith("NEXT_REDIRECT") ||
      digest.startsWith("NEXT_NOT_FOUND") ||
      digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  );
}

/** Server-side helper: returns the current user with fresh subscription state, or null.
 * Never throws on config/DB errors — if auth or the database is misconfigured
 * (e.g. missing AUTH_SECRET or DATABASE_URL on a fresh deploy) it returns null so
 * public pages still render and gated pages redirect to login rather than 500. */
export async function getCurrentUser() {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return await prisma.user.findUnique({ where: { id: session.user.id } });
  } catch (err) {
    if (isNextControlFlowError(err)) throw err;
    console.error("getCurrentUser failed:", err);
    return null;
  }
}

/** Session lookup that never throws on config errors. Safe to call from public pages. */
export async function safeAuth() {
  try {
    return await auth();
  } catch (err) {
    if (isNextControlFlowError(err)) throw err;
    console.error("auth() failed:", err);
    return null;
  }
}

/** True when the given subscription status currently grants access. */
export function isMember(status?: SubscriptionStatus | null) {
  return !!status && ACTIVE.includes(status);
}
