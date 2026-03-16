import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import LanguageSelector from "../components/LanguageSelector";
import Navbar from "../components/Navbar";
import FloatingTicketButton from "../components/FloatingTicketButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "OpSecForge Hub | Zero-Trust Local Developer Suite",
  description: "A suite of zero-trust, 100% client-side security tools for developers. Handle sensitive JWTs, .env files, and JSON logs safely in your browser.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7680565010427495"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pt-28 md:pt-16`}
      >
        <Navbar />
        {children}
        <footer className="border-t border-slate-800 bg-slate-950 px-4 py-6">
          <div className="mx-auto flex max-w-[1400px] items-center justify-center">
            <Link
              href="/terms-of-service"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-emerald-400"
            >
              Terms of Service
            </Link>
          </div>
        </footer>
        <LanguageSelector />
        <FloatingTicketButton />
        <Analytics />
      </body>
    </html>
  );
}
