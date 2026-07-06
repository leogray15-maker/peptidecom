import type { Metadata } from "next";
import "./globals.css";
import { DisclaimerBar } from "@/components/disclaimer-bar";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

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
