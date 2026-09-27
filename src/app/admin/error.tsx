"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui";

/** Error state inside the app shell, so the sidebar stays usable. */
export default function AppError({
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
    <EmptyState
      tone="error"
      icon={AlertTriangle}
      title="This page couldn't load"
      body={
        <>
          Something went wrong on our side. Try again, or head back to the overview.
          {error.digest && <span className="mt-2 block font-mono text-[11.5px]">Reference: {error.digest}</span>}
        </>
      }
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/admin" className="btn-secondary">
            CRM overview
          </Link>
        </div>
      }
      className="mt-10 py-16"
    />
  );
}
