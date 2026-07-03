export const metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <>
      <h1>Research disclaimer</h1>
      <p className="text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>

      <p>
        Everything discussed, listed, calculated or shared on this platform is
        provided <strong>strictly for research, educational and informational
        purposes only</strong>. Products referenced are{" "}
        <strong>not for human consumption</strong> and are{" "}
        <strong>not for medical use</strong>.
      </p>

      <h2>Not medical advice</h2>
      <p>
        Nothing on this site constitutes medical, pharmaceutical, or professional
        advice. The reconstitution calculator and dosing references are
        educational tools; you are solely responsible for verifying any
        calculations. Always consult a qualified healthcare professional.
      </p>

      <h2>No endorsement of vendors</h2>
      <p>
        Vendor listings, reviews, ratings and lab results are community-contributed
        and provided as-is. We do not sell products, and a listing or “verified”
        badge is not an endorsement or a guarantee of legality, safety, quality or
        fitness for any purpose.
      </p>

      <h2>Your responsibility</h2>
      <p>
        You are responsible for complying with all laws and regulations that apply
        to you in your jurisdiction. By using this platform you confirm you are of
        legal age and that you understand and accept these terms.
      </p>

      <p className="text-sm text-slate-500">
        This is placeholder text and not legal advice. Obtain professional legal
        review before launch.
      </p>
    </>
  );
}
