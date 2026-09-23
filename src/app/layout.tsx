import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DisclaimerBar } from "@/components/disclaimer-bar";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

// "Nocturne" type: a soft serif for headings and the numbers that matter, a
// clean grotesk for everything you tap, a mono for small eyebrow labels.
// Self-hosted by next/font at build, so no runtime request to Google.
const display = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono",
  display: "swap",
});

// Colors the phone status bar / browser chrome. #0d0c14 is the disclaimer
// bar's color (lab-sunken), so the status bar blends into the top of every
// page instead of showing up white.
export const viewport: Viewport = {
  themeColor: "#0d0c14",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: {
    default: `${appName} — Skin recovery & healing tracker`,
    template: `%s · ${appName}`,
  },
  description:
    "A private membership for skin recovery and healing: a daily tracker, photo timeline, withdrawal stage map, protocols, peptide tools and a community. For research & educational purposes only.",
  // icon.png / apple-icon.png live next to this file; Next emits the <link>
  // tags from those file conventions. Declared here too so the manifest is
  // linked and iOS treats an added-to-home-screen install as a standalone app
  // (without appleWebApp, iOS shows a screenshot of the page as the icon).
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: appName,
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <DisclaimerBar />
        {children}
      </body>
    </html>
  );
}
