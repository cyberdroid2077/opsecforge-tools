import React from 'react';
import type { Metadata } from 'next';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getAdsenseClient } from '@/lib/ads';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'OpsecForge privacy policy and browser-local tool-input processing statement.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  // The advertising section describes AdSense only in builds where the ad script is enabled.
  const adsEnabled = Boolean(getAdsenseClient());
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <h1 className="text-4xl font-bold text-slate-100 mb-12">Privacy Policy</h1>
        <div className="prose prose-invert prose-slate lg:prose-lg max-w-none">
          <p className="text-xl text-slate-400 mb-8">
            This policy describes how tool inputs, aggregate analytics, and site resources are handled.
          </p>
          <h2 className="text-slate-100">Tool-input processing</h2>
          <p>
            Core transformations for OpsecForge&apos;s sanitizers, formatters, encoders, decoders, and generators run in the loaded browser page unless a tool explicitly states otherwise.
          </p>
          <ul className="space-y-4 my-8">
            <li className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <span><strong>Local execution:</strong> Tool input is processed in browser memory and is not submitted to an OpsecForge processing API.</span>
            </li>
            <li className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <span><strong>No tool-input database:</strong> OpsecForge does not store user-pasted tool content in a backend database.</span>
            </li>
            <li className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <span><strong>No input-level analytics:</strong> Tool input and generated output are not included in analytics events.</span>
            </li>
          </ul>
          <h2 className="text-slate-100">Analytics</h2>
          <p>
            OpsecForge uses Vercel Web Analytics for aggregate page-view measurement. According to Vercel&apos;s documentation, Web Analytics does not use third-party cookies; visitors are identified by a hash created from the incoming request, and the visitor session is discarded after 24 hours. These events do not include tool input or output.
          </p>
          <h2 className="text-slate-100">Advertising and cookies</h2>
          {adsEnabled ? (
          <>
          <p>
            OpsecForge may show advertisements served by Google AdSense on blog articles. Ads are not placed inside tool interfaces, and OpsecForge does not send tool input or output to advertisers or to Google.
          </p>
          <ul className="list-disc space-y-2 pl-6 my-6">
            <li>
              Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.
            </li>
            <li>
              You can opt out of personalized advertising by visiting <a href="https://adssettings.google.com" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">Google Ads Settings</a>. You can also opt out of some third-party vendors&apos; use of cookies for personalized advertising at <a href="https://www.aboutads.info" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">aboutads.info</a>.
            </li>
            <li>
              Visitors in the European Economic Area, the United Kingdom, and Switzerland are shown a consent message provided by a Google-certified consent management platform (CMP) before personalized ads can be served.
            </li>
          </ul>
          <p>
            For details on how Google uses data from sites that use its services, see Google&apos;s <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">partner-sites explanation</a>. OpsecForge does not currently use any other advertising network.
          </p>
          </>
          ) : (
          <p>
            At the time of this update, OpsecForge does not serve advertisements or load the AdSense ad-serving script. The public ads.txt file and publisher meta tag are ownership-verification signals; they do not by themselves display ads. This section will be updated before advertising is enabled.
          </p>
          )}
          <h2 className="text-slate-100">Contact</h2>
          <p>
            For questions about our privacy commitment, please contact us at <a href="mailto:admin@opsecforge.com" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">admin@opsecforge.com</a>.
          </p>
        </div>
        <div className="mt-24 pt-8 border-t border-slate-900 text-slate-600 text-sm">
          Last Updated: October 24, 2026.
        </div>
      </div>
    </main>
  );
}
