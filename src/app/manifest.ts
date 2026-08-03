import type { MetadataRoute } from "next";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

/** Web app manifest — what Android and desktop browsers read when the app is
 * installed to a home screen. iOS ignores most of this and uses the
 * apple-icon.png + appleWebApp metadata in layout.tsx instead. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appName} — Skin recovery & healing tracker`,
    short_name: appName,
    description:
      "A private membership for skin recovery and healing: a daily tracker, photo timeline, withdrawal stage map, protocols, peptide tools and a community.",
    start_url: "/dashboard",
    display: "standalone",
    // Matches the disclaimer bar / status bar colour set in layout.tsx.
    theme_color: "#181139",
    background_color: "#07070a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // The icons are full-bleed, so they survive Android's adaptive mask.
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
