/** Quiet clinician pointer for the recovery/health pages. The general
 * "not medical advice" line lives in the page footer. */
export function PeerSupportNote() {
  return (
    <p className="mt-6 text-meta text-fg-muted">
      For diagnosis and treatment, please work with a qualified clinician.
    </p>
  );
}
