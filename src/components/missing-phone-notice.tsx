import Link from "next/link";
import { Phone } from "lucide-react";

/**
 * Prompt for members who joined before signup asked for a number.
 *
 * Deliberately not dismissible: it disappears the moment a number is saved,
 * and the whole point is that an account with only an email address is one we
 * can't reach when their payment stalls.
 */
export function MissingPhoneNotice() {
  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
    >
      <Phone className="h-5 w-5 shrink-0 text-amber-300" />
      <p className="min-w-0 flex-1 text-sm text-amber-100/90">
        We don&apos;t have a phone number for you. Add one so we can reach you about an
        order or a payment that needs sorting out — we won&apos;t use it for anything else.
      </p>
      <Link href="/settings" className="btn-secondary shrink-0">
        Add my number
      </Link>
    </div>
  );
}
