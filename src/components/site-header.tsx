import Link from "next/link";
import { Logo } from "@/components/logo";
import { safeAuth } from "@/lib/auth";

export async function SiteHeader() {
  const session = await safeAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-lab-border bg-lab-bg/80 backdrop-blur">
      <div className="container-lab flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
          <Link href="/#features" className="hover:text-white">Features</Link>
          <Link href="/#tools" className="hover:text-white">Tools</Link>
          <Link href="/#trust" className="hover:text-white">Trust</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link href="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/pricing" className="btn-primary">Join</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
