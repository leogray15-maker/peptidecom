import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let cached: App | null = null;

/** Lazily initialise the Firebase Admin app. Throws only when actually called
 * without credentials, so importing this module never breaks the build. */
function getAdminApp(): App {
  if (cached) return cached;
  if (getApps().length) {
    cached = getApps()[0];
    return cached;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Private keys are stored with literal \n in env vars; convert to real newlines.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
  }

  cached = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return cached;
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

/** Session cookie lifetime: 14 days (Firebase max is 14 days). */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;
export const SESSION_COOKIE_NAME = "__session";
