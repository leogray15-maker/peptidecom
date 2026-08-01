// The Arcane mark — the arrowhead glyph, traced from the brand artwork.
// Single evenodd path so it works as a favicon, an app icon and inline UI at
// any size. `currentColor` by default, so callers set the colour with text-*.
export function ArcaneMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="currentColor"
    >
      <path fillRule="evenodd" d={ARCANE_MARK_PATH} />
    </svg>
  );
}

/** Exported so the icon routes can reuse the exact same geometry. */
export const ARCANE_MARK_PATH =
  "M 512 0 515.5 0 523.4 6.1 549.6 51.6 999.5 867.3 998.6 873.5 989.9 873.5 919.8 864.7 834.1 866.5 785.1 873.5 729.1 887.5 676.5 906.7 608.3 943.5 566.3 975 515.5 1024 512 1023.1 508.5 1024 457.7 975 415.7 943.5 347.5 906.7 294.9 887.5 238.9 873.5 189.9 866.5 104.2 864.7 34.1 873.5 25.4 873.5 24.5 867.3 474.4 51.6 500.6 6.1 508.5 0Z M512 638.2 513.8 640.7 546.1 590.8 589 546.1 627.5 514.6 684.4 480.5 512 164.2 339.6 480.5 396.5 514.6 435 546.1 477.9 590.8 510.2 640.7Z M512 933 573.3 877 657.3 828 708 808.7 753.6 796.4 849 783.3 729.1 558.4 653.8 596.9 620.5 623.2 579.4 667.8 546.1 732.6 530.4 790.3 521.6 842.8 513.8 849 512 849 510.2 849 502.4 842.8 493.6 790.3 477.9 732.6 444.6 667.8 403.5 623.2 370.2 596.9 294.9 558.4 175 783.3 270.4 796.4 316 808.7 366.7 828 450.7 877Z";
