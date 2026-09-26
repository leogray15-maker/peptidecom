import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { color } from "@/lib/tokens";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

// Type: Geist for UI and body, Geist Mono for numbers and eyebrows, and
// Instrument Serif for page titles only. Self-hosted by next/font at build,
// so no runtime request to Google.
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// Colors the phone status bar / browser chrome to match the page background.
export const viewport: Viewport = {
  themeColor: color.bg,
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
        {children}
      </body>
    </html>
  );
}
