import "./globals.css";

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const notoSansThai = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  fallback: ["Leelawadee UI", "Tahoma", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
  variable: "--font-noto-sans-thai",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jaimaiwailaew.vercel.app",
  ),
  applicationName: "Jai Mai Wai Laew",
  title: {
    default: "จ่ายไม่ไหวแล้ว | ผู้ช่วยเตรียมข้อมูลภาษี",
    template: "%s | จ่ายไม่ไหวแล้ว",
  },
  description:
    "โครงสร้างเว็บแอปสำหรับช่วยบันทึกและประมาณการภาษี โดยเน้นความเป็นส่วนตัวและการประมวลผลบนอุปกรณ์",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html className={notoSansThai.variable} lang="th" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
          <ServiceWorkerRegistration />
        </AppProviders>
      </body>
    </html>
  );
}
