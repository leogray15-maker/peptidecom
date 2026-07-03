import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { PricingPlans } from "@/components/pricing-plans";

export const metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

const perks = [
  "Full access to the members-only community",
  "Vendor directory with verified badges & reviews",
  "Complete lab test / COA library",
  "Reconstitution calculator & dosing tools",
  "Private progress tracking with charts",
  "Group buy coordination & member pricing",
  "Scam reports & vendor warnings",
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const authed = !!user;
  const member = hasAccess(user);

  return (
    <>
      <SiteHeader />
      <section className="border-b border-lab-border py-16">
        <div className="container-lab text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            One membership. Everything included.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Join the community, get every tool, and see every lab test. Cancel
            anytime from your account.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-lab grid gap-8 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-white">What&apos;s included</h2>
            <ul className="mt-5 space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            {member ? (
              <div className="card text-center">
                <p className="text-lg font-semibold text-white">
                  You&apos;re already a member 🎉
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Your membership is active. Head to your dashboard.
                </p>
                <Link href="/dashboard" className="btn-primary mt-6">
                  Go to dashboard
                </Link>
              </div>
            ) : authed ? (
              <PricingPlans />
            ) : (
              <div className="card text-center">
                <p className="text-lg font-semibold text-white">Create an account first</p>
                <p className="mt-2 text-sm text-slate-400">
                  You&apos;ll pick your plan right after signing up.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link href="/register" className="btn-primary">Sign up</Link>
                  <Link href="/login" className="btn-secondary">I already have an account</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
