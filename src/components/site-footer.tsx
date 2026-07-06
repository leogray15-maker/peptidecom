import Link from "next/link";
import { Logo } from "@/components/logo";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

export function SiteFooter() {
  return (
    <footer className="border-t border-lab-border bg-lab-bg">
      <div className="container-lab py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm text-slate-400">
              Private membership for skin recovery &amp; healing — daily tracking,
              a photo timeline, protocols and a community that gets it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <h4 className="font-semibold text-white">Product</h4>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li><Link href="/#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/#tools" className="hover:text-white">Calculator</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Account</h4>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li><Link href="/login" className="hover:text-white">Log in</Link></li>
                <li><Link href="/register" className="hover:text-white">Sign up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Legal</h4>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li><Link href="/legal/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/legal/disclaimer" className="hover:text-white">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-lab-border pt-6 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {appName}. All products discussed are for
            research purposes only and not for human consumption. Nothing on this
            site is medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
