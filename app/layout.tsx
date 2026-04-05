import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EMAS Gold Tracker",
    template: "%s | EMAS Gold Tracker",
  },
  description:
    "Premium Malaysia gold price tracker with live pricing, spread simulation, portfolio insights, offline support, and installable PWA tooling.",
  applicationName: "EMAS Gold Tracker",
  keywords: [
    "gold price malaysia",
    "harga emas malaysia",
    "gold tracker",
    "public gold calculator",
    "xau myr",
    "portfolio emas",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "EMAS Gold Tracker",
    title: "EMAS Gold Tracker",
    description:
      "Track estimated Malaysia gold buy prices, compare spread-adjusted pricing, and monitor your portfolio in one installable dashboard.",
    locale: "en_MY",
  },
  twitter: {
    card: "summary_large_image",
    title: "EMAS Gold Tracker",
    description:
      "Live Malaysia gold tracking with spread simulation, calculator tools, portfolio monitoring, and offline-ready support.",
  },
  category: "finance",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EMAS Gold Tracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#D4AF37",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-MY">
      <body>{children}</body>
    </html>
  );
}
