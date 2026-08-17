import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DisclaimerBar } from "@/components/disclaimer-bar";
import { WhopPageViews } from "@/components/whop-pixel";
import { WHOP_PIXEL_SNIPPET } from "@/lib/whop-pixel";

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
    <html lang="en" className="dark">
      <head>
        {/* Whop ad pixel. Whop requires it in the <head> of every page, so it
            lives in the root layout rather than in a page or in next/script
            (which injects into <body> for anything but beforeInteractive).
            The snippet fires its own "page" event on first load; SPA
            navigations are tracked by <WhopPageViews /> below. */}
        <script dangerouslySetInnerHTML={{ __html: WHOP_PIXEL_SNIPPET }} />
      </head>
      <body>
        <DisclaimerBar />
        {children}
        <WhopPageViews />
      </body>
    </html>
  );
}
