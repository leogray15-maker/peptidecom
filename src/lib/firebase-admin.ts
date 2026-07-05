import "server-only";
import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";

let cached: App | null = null;

/** Robustly normalise a private key pasted into an env var:
 * - trims whitespace
 * - strips surrounding single/double quotes (a common Vercel paste mistake)
 * - converts literal \n escape sequences to real newlines */
function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, "\n");
  return key;
}

interface AdminCreds {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

/** Load admin credentials from either FIREBASE_SERVICE_ACCOUNT (the full
 * service-account JSON pasted into one var — easiest) or the three separate
 * FIREBASE_* vars. */
function loadCredentials(): AdminCreds {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json && json.trim()) {
    try {
      const parsed = JSON.parse(json.trim());
      return {
        projectId: parsed.project_id ?? parsed.projectId,
        clientEmail: parsed.client_email ?? parsed.clientEmail,
        privateKey: normalizePrivateKey(parsed.private_key ?? parsed.privateKey),
      };
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON.");
    }
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  };
}

/** Lazily initialise the Firebase Admin app. The firebase-admin packages are
 * imported dynamically (only when actually used) so merely importing this module
 * never executes firebase-admin's dynamic requires — which can crash at module
 * load in a bundled serverless environment. */
async function getAdminApp(): Promise<App> {
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");

  if (cached) return cached;
  if (getApps().length) {
    cached = getApps()[0];
    return cached;
  }

  const creds = loadCredentials();
  if (!creds.projectId || !creds.clientEmail || !creds.privateKey) {
    const missing = [
      !creds.projectId && "project id",
      !creds.clientEmail && "client email",
      !creds.privateKey && "private key",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Firebase Admin is not configured (missing: ${missing}). Set FIREBASE_SERVICE_ACCOUNT (full JSON) or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.`
    );
  }
  const { projectId, clientEmail, privateKey } = creds;

  cached = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return cached;
}

export async function adminAuth(): Promise<Auth> {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(await getAdminApp());
}

/** Session cookie lifetime: 14 days (Firebase max is 14 days). */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;
export const SESSION_COOKIE_NAME = "__session";
