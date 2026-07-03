export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>

      <p>
        This placeholder Privacy Policy explains what we collect and how we use it.
      </p>

      <h2>What we collect</h2>
      <p>
        Account details (name, email), authentication data, subscription and
        billing metadata (handled by Stripe — we never store card numbers), and the
        content you create such as posts, progress logs and reviews.
      </p>

      <h2>How we use it</h2>
      <p>
        To operate the platform, authenticate you, process your subscription,
        display community content, and improve the service. Your private progress
        data is visible only to you unless you choose to share it.
      </p>

      <h2>Third parties</h2>
      <p>
        We use Stripe for payments and may use hosting and analytics providers.
        These process data on our behalf under their own terms.
      </p>

      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal
        data. Contact us to exercise these rights.
      </p>

      <p className="text-sm text-slate-500">
        Placeholder text — obtain professional legal review and a GDPR/UK-DPA
        compliant policy before launch.
      </p>
    </>
  );
}
