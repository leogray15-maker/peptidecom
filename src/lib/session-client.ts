"use client";

import type { User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";

/** After a Firebase sign-in, exchange the ID token for a server session cookie
 * and refresh the local token so custom claims (member/role) are available for
 * Firestore. Throws on failure. */
export async function establishSession(user: User) {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
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
