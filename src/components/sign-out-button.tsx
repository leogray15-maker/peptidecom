"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { endSession } from "@/lib/session-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await endSession();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
    >
      <LogOut className="h-4.5 w-4.5" />
      Sign out
    </button>
  );
}
