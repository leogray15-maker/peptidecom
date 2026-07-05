import Link from "next/link";
import { Logo } from "@/components/logo";
import { SetupModeBanner } from "@/components/setup-mode-banner";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col">
      <div className="container-lab flex h-16 items-center">
        <Logo />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <SetupModeBanner />
          {children}
        </div>
      </div>
      <div className="container-lab py-6 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300">← Back to home</Link>
      </div>
    </div>
  );
}
