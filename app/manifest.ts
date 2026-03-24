import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EMAS Gold Tracker",
    short_name: "EMAS",
    description: "Malaysia gold tracker with Public Gold-style estimated pricing.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0F14",
    theme_color: "#D4AF37",
    lang: "en-MY",
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
  };
}
