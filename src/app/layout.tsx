import type { Metadata } from "next";
import "./globals.css";
import { DisclaimerBar } from "@/components/disclaimer-bar";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "The Arcane Lab";

export const metadata: Metadata = {
  title: {
    default: `${appName} — Peptide research community`,
    template: `%s · ${appName}`,
  },
  description:
    "A private, members-only community for peptide research: vendor verification, lab testing, dosing tools and progress tracking. For research purposes only.",
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
