"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";

/** Client-side signed-in check for the public header. Keeps the marketing pages
 * free of any server-side auth/DB imports so they can never 500 from config. */
export function HeaderAuthButtons() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!clientAuth) {
      setSignedIn(false);
      return;
    }
    return onAuthStateChanged(clientAuth, (u) => setSignedIn(!!u));
  }, []);

  if (signedIn) {
    return (
      <Link href="/dashboard" className="btn-primary">
        Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className="btn-ghost">Log in</Link>
      <Link href="/pricing" className="btn-primary">Join</Link>
    </>
  );
}
