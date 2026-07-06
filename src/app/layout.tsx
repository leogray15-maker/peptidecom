import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DisclaimerBar } from "@/components/disclaimer-bar";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

// Colors the phone status bar / browser chrome. #181139 is the disclaimer
// bar's rendered color (brand-950 at 60% over lab-bg), so the status bar
// blends into the top of every page instead of showing up white.
export const viewport: Viewport = {
  themeColor: "#181139",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: {
    default: `${appName} — Skin recovery & healing tracker`,
    template: `%s · ${appName}`,
  },
  description:
    "A private membership for skin recovery and healing: a daily tracker, photo timeline, withdrawal stage map, protocols, peptide tools and a community. For research & educational purposes only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <DisclaimerBar />
        {children}
      </body>
    </html>
  );
}
