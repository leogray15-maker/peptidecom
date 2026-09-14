"use client";

import type { User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";

export interface SessionOptions {
  /** Cloudflare Turnstile token — only needed on the signup path. */
  turnstileToken?: string | null;
  /** Contact number from the signup form, stored on the account row. */
  phone?: string | null;
}

/** After a Firebase sign-in, exchange the ID token for a server session cookie
 * and refresh the local token so custom claims (member/role) are available for
 * Firestore. Throws on failure. */
export async function establishSession(user: User, options: SessionOptions = {}) {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      turnstileToken: options.turnstileToken ?? null,
      phone: options.phone ?? null,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Could not create session.");
  }
  // Force-refresh so the freshly-set membership claim lands in the client token.
  await user.getIdToken(true);
}

/** Sign out of Firebase and clear the server session cookie. */
export async function endSession() {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } finally {
    if (clientAuth) {
      const { signOut } = await import("firebase/auth");
      await signOut(clientAuth);
    }
  }
}
