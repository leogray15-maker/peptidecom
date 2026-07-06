import { ArrowRight, MessagesSquare, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Community chat" };

export default function ChatPage() {
  // Set NEXT_PUBLIC_WHATSAPP_INVITE_URL to your WhatsApp community invite link.
  const invite = process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL ?? null;

  return (
    <div>
      <PageHeader
        title="Community chat"
        subtitle="The live conversation happens on WhatsApp — members only, moderated, real people."
      />

      <div className="card flex flex-col items-center py-14 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#25D366]/15 text-[#25D366]">
          <MessagesSquare className="h-7 w-7" />
        </div>
        <p className="mt-5 text-lg font-semibold text-white">Join the WhatsApp community</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Day-to-day chat, quick questions, flare-day company and wins as they happen. It&apos;s
          the fastest way to reach people who get it.
        </p>
        {invite ? (
          <a
            href={invite}
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-6 bg-[#25D366] text-black hover:bg-[#1fb857]"
          >
            Open the invite <ArrowRight className="h-4 w-4" />
          </a>
        ) : (
          <p className="mt-6 rounded-xl border border-lab-border bg-lab-bg px-4 py-2.5 text-sm text-slate-400">
            The invite link is being set up — check back shortly.
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <Users className="h-5 w-5 text-brand-300" />
          <p className="mt-3 font-semibold text-white">Members only</p>
          <p className="mt-1 text-sm text-slate-400">
            The invite is for paying members — keep it inside the lab so the space stays
            high-trust.
          </p>
        </div>
        <div className="card">
          <ShieldCheck className="h-5 w-5 text-brand-300" />
          <p className="mt-3 font-semibold text-white">House rules</p>
          <p className="mt-1 text-sm text-slate-400">
            Be kind, no medical advice, no sourcing spam. Moderators keep it clean so it stays
            useful.
          </p>
        </div>
      </div>
    </div>
  );
}
