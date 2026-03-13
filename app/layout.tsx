import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pt-16`}
      >
        <Navbar />
        {children}
        <LanguageSelector />
        <FloatingTicketButton />
        <Analytics />
      </body>
    </html>
  );
}
