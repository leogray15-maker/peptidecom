"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-brand-400">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold text-white">We hit an unexpected error</h1>
        <p className="mt-3 text-sm text-slate-400">
          This has been logged. If it persists, check the app configuration.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-slate-600">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/" className="btn-secondary">Go home</Link>
        </div>
      </div>
    </div>
  );
}
