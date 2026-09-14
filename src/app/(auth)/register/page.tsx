"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { clientAuth, firebaseEnabled, googleProvider } from "@/lib/firebase-client";
import { establishSession } from "@/lib/session-client";
import { GoogleIcon } from "@/components/google-icon";
import { InAppBrowserNotice, useInAppBrowser } from "@/components/in-app-browser-guard";
import { Turnstile } from "@/components/turnstile";
import { PhoneField } from "@/components/phone-field";
import { DEFAULT_DIAL_CODE, normalizePhone } from "@/lib/phone";

const PHONE_ERROR = `Add a mobile number we can reach you on, with its country code (e.g. +${DEFAULT_DIAL_CODE} 7700 900123).`;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Which sign-up path produced the error, so it renders beside the button
  // that was actually pressed rather than somewhere off-screen.
  const [errorSource, setErrorSource] = useState<"email" | "google">("email");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const inAppBrowser = useInAppBrowser();
  // Cloudflare Turnstile. Stays null when the widget isn't configured, which is
  // exactly what the server expects in that case (lib/turnstile.ts fails open).
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setErrorSource("email");
    if (!clientAuth) return setError("Sign-up is not configured yet.");
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return setError(PHONE_ERROR);
    setError(null);
    setLoading("email");
    try {
      const cred = await createUserWithEmailAndPassword(clientAuth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      await establishSession(cred.user, { turnstileToken, phone: normalizedPhone });
      router.push("/pricing?welcome=1");
      router.refresh();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(null);
    }
  }

  async function withGoogle() {
    setErrorSource("google");
    if (!clientAuth) return setError("Sign-up is not configured yet.");
    // Google hands us an email, never a number — so it still has to be typed in
    // before the popup opens, not discovered as missing afterwards.
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return setError(PHONE_ERROR);
    setError(null);
    setLoading("google");
    try {
      const cred = await signInWithPopup(clientAuth, googleProvider);
      await establishSession(cred.user, { turnstileToken, phone: normalizedPhone });
      router.push("/pricing?welcome=1");
      router.refresh();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(null);
    }
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-white">Create your account</h1>
      <p className="mt-1 text-sm text-slate-400">
        Step 1 of 2 — you&apos;ll choose your membership next.
      </p>

      {!firebaseEnabled && (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          Firebase isn&apos;t configured. Add the NEXT_PUBLIC_FIREBASE_* env vars to enable sign-up.
        </p>
      )}

      <div className="mt-6">
        <PhoneField value={phone} onChange={setPhone} />
      </div>

      {error && errorSource === "google" && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {inAppBrowser ? (
        <InAppBrowserNotice appName={inAppBrowser} />
      ) : (
        <button
          onClick={withGoogle}
          disabled={loading !== null}
          className="btn-secondary mt-4 w-full"
        >
          {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>
      )}

      <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
        <div className="h-px flex-1 bg-lab-border" /> or <div className="h-px flex-1 bg-lab-border" />
      </div>

      <form onSubmit={withEmail} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Display name</label>
          <input id="name" required minLength={2} className="input"
            value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input"
            value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={8} className="input"
            value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <Turnstile onToken={setTurnstileToken} />
        {error && errorSource === "email" && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading !== null}>
          {loading === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already a member?{" "}
        <Link href="/login" className="font-medium text-brand-300 hover:text-brand-200">
          Log in
        </Link>
      </p>
    </div>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("email-already-in-use")) return "An account with that email already exists.";
  if (code.includes("weak-password")) return "Password is too weak (min 8 characters).";
  if (code.includes("invalid-email")) return "That email looks invalid.";
  if (code.includes("popup-closed")) return "Sign-up was cancelled.";
  if (code.includes("disallowed_useragent") || (err as Error)?.message?.includes("disallowed_useragent"))
    return "Google blocks sign-in inside in-app browsers. Open this page in Safari or Chrome, or use email sign-up below.";
  if (code.includes("unauthorized-domain"))
    return "This domain isn't authorized for Google sign-in yet. Add it in Firebase → Authentication → Settings → Authorized domains. (Email/password sign-up still works.)";
  if (code.includes("operation-not-allowed"))
    return "This sign-in method is disabled. Enable it in Firebase → Authentication → Sign-in method.";
  return (err as Error)?.message ?? "Something went wrong.";
}
