import type { MetadataRoute } from "next";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

// PWA manifest — this is what "Add to Home Screen" reads on Android/Chrome.
// (iOS reads app/apple-icon.png instead, which is generated from the same mark.)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appName} — skin recovery & healing`,
    short_name: appName,
    description:
      "Track your skin daily, see the patterns in your own data, and heal alongside people who get it.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07070a",
    theme_color: "#181139",
    categories: ["health", "lifestyle", "medical"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Log today",
        short_name: "Log today",
        url: "/tracker",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Add a photo",
        short_name: "Photo",
        url: "/photos",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Community",
        short_name: "Community",
        url: "/community",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
