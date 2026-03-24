import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EMAS Gold Tracker",
  description:
    "Premium Malaysia gold price tracker with live pricing, spread simulation, portfolio insights, and offline-ready tooling.",
  applicationName: "EMAS Gold Tracker",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
