"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { clientAuth, firebaseEnabled, googleProvider } from "@/lib/firebase-client";
import { establishSession } from "@/lib/session-client";
import { GoogleIcon } from "@/components/google-icon";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card text-sm text-slate-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("email");

    // 1. Try Firebase email/password (real member auth) if available.
    if (clientAuth) {
      try {
        const cred = await signInWithEmailAndPassword(clientAuth, email, password);
        await establishSession(cred.user);
        router.push(callbackUrl);
        router.refresh();
        return;
      } catch {
        // fall through to the reliable admin login
      }
    }

    // 2. Admin login fallback (works without Firebase/Google/DB).
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      setError(data.error ?? "Invalid email or password.");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(null);
  }

  async function withGoogle() {
    if (!clientAuth) return setError("Sign-in is not configured yet.");
    setError(null);
    setLoading("google");
    try {
      const cred = await signInWithPopup(clientAuth, googleProvider);
      await establishSession(cred.user);
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(null);
    }
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-400">Log in to the lab.</p>

      {!firebaseEnabled && (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          Firebase isn&apos;t configured. Add the NEXT_PUBLIC_FIREBASE_* env vars to enable sign-in.
        </p>
      )}

      <button
        onClick={withGoogle}
        disabled={loading !== null}
        className="btn-secondary mt-6 w-full"
      >
        {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
        <div className="h-px flex-1 bg-lab-border" /> or <div className="h-px flex-1 bg-lab-border" />
      </div>

      <form onSubmit={withEmail} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input"
            value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required className="input"
            value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading !== null}>
          {loading === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        No account?{" "}
        <Link href="/register" className="font-medium text-brand-300 hover:text-brand-200">
          Join the lab
        </Link>
      </p>
    </div>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Invalid email or password.";
  if (code.includes("popup-closed")) return "Sign-in was cancelled.";
  if (code.includes("too-many-requests")) return "Too many attempts. Try again later.";
  return (err as Error)?.message ?? "Something went wrong.";
}
