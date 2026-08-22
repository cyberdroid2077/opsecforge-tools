import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "../components/Navbar";
import FloatingTicketButton from "../components/FloatingTicketButton";

const themeBootstrapScript = `
  (function() {
    const storageKey = "opsecforge-theme";
    const storedTheme = window.localStorage.getItem(storageKey);
    const resolvedTheme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  })();
`;

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
  metadataBase: new URL("https://www.opsecforge.com"),
  title: {
    default: "OpSecForge Hub | Privacy-First Developer Tools",
    template: "%s | OpsecForge",
  },
  description: "Browser-local developer tools and source-reviewed guidance for formatting, inspecting, and sanitizing sensitive technical data.",
  other: {
    "google-adsense-account": "ca-pub-7680565010427495",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "OpsecForge",
    url: "https://www.opsecforge.com",
    title: "OpSecForge Hub | Privacy-First Developer Tools",
    description: "Browser-local tools for JWTs, environment files, hashes, JSON, SQL, and other sensitive developer data.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased transition-colors duration-300 pt-16`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "OpsecForge",
              url: "https://www.opsecforge.com",
            }),
          }}
        />
        <Navbar />
        {children}
        <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 transition-colors">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {[
              ['About', '/about'],
              ['Case Studies', '/case-studies'],
              ['Glossary', '/glossary'],
              ['FAQ', '/faq'],
              ['Privacy', '/privacy'],
              ['Terms', '/terms-of-service'],
              ['Contact', '/contact'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded text-sm font-medium text-slate-400 transition-colors hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {label}
              </Link>
            ))}
          </div>
        </footer>
        <FloatingTicketButton />
        <Analytics />
      </body>
    </html>
  );
}
