import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EMAS Gold Tracker",
    short_name: "EMAS",
    description: "Malaysia gold tracker with Public Gold-style estimated pricing, portfolio monitoring, and offline-ready support.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0F14",
    theme_color: "#D4AF37",
    lang: "en-MY",
    categories: ["finance", "business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Open calculator",
        short_name: "Calculator",
        description: "Jump straight into the gold calculator tools.",
        url: "/#calculator",
      },
      {
        name: "View portfolio",
        short_name: "Portfolio",
        description: "Open portfolio tracking and performance view.",
        url: "/#portfolio",
      },
    ],
  };
}
