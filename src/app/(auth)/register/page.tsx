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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!clientAuth) return setError("Sign-up is not configured yet.");
    setError(null);
    setLoading("email");
    try {
      const cred = await createUserWithEmailAndPassword(clientAuth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      await establishSession(cred.user);
      router.push("/pricing?welcome=1");
      router.refresh();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(null);
    }
  }

  async function withGoogle() {
    if (!clientAuth) return setError("Sign-up is not configured yet.");
    setError(null);
    setLoading("google");
    try {
      const cred = await signInWithPopup(clientAuth, googleProvider);
      await establishSession(cred.user);
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
        {error && <p className="text-sm text-red-400">{error}</p>}
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
  return (err as Error)?.message ?? "Something went wrong.";
}
