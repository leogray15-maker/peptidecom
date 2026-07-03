export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>

      <p>
        These placeholder Terms of Service govern your access to and use of the
        platform. By creating an account or subscribing, you agree to them.
      </p>

      <h2>1. Membership & billing</h2>
      <p>
        Access to member content requires an active paid subscription, billed
        monthly or annually via Stripe. Subscriptions renew automatically until
        cancelled. You can cancel anytime from the billing portal; access
        continues until the end of the current period. Fees are non-refundable
        except where required by law.
      </p>

      <h2>2. Acceptable use</h2>
      <p>
        You agree not to post unlawful, misleading, or harmful content, not to
        impersonate others, and not to use the platform to facilitate anything
        illegal in your jurisdiction. We may remove content and suspend accounts
        that breach these terms.
      </p>

      <h2>3. User content</h2>
      <p>
        You retain ownership of content you post but grant us a licence to display
        it within the platform. You are responsible for the accuracy of reviews,
        lab results and other contributions.
      </p>

      <h2>4. Research-only</h2>
      <p>
        All content is for research and educational purposes only, as set out in
        our <a href="/legal/disclaimer">Disclaimer</a>.
      </p>

      <h2>5. Liability</h2>
      <p>
        The platform is provided “as is”. To the fullest extent permitted by law we
        disclaim all warranties and are not liable for any loss arising from your
        use of the platform or reliance on its content.
      </p>

      <p className="text-sm text-slate-500">
        Placeholder text — obtain professional legal review before launch.
      </p>
    </>
  );
}
