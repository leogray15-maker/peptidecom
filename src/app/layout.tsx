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

const description =
  "A private membership for skin recovery and healing: a 20-second daily tracker, AI flare grading, EASI & POEM scores, a photo timeline, a product scanner, protocols and a community that gets it. For research & educational purposes only.";

export const metadata: Metadata = {
  title: {
    default: `${appName} — Skin recovery & healing tracker`,
    template: `%s · ${appName}`,
  },
  description,
  applicationName: appName,
  // Installed to the home screen this becomes a standalone app, with the
  // Arcane mark as its icon (app/apple-icon.png + app/manifest.ts).
  appleWebApp: {
    capable: true,
    title: appName,
    statusBarStyle: "black",
  },
  openGraph: {
    type: "website",
    siteName: appName,
    title: `${appName} — skin recovery, tracked properly`,
    description,
  },
  twitter: { card: "summary_large_image", title: appName, description },
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
