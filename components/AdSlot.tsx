'use client';

import { useEffect } from 'react';
import { AD_SLOT_MIN_HEIGHT, MIN_AD_WORDS, getAdsenseClient, getArticleSlot } from '@/lib/ads';

type AdSlotProps = {
  /** Word count of the article body. Below MIN_AD_WORDS nothing is rendered. */
  wordCount: number;
};

/**
 * In-article ad. Blog articles only: never place inside a tool UI or above the page H1.
 * Renders nothing unless NEXT_PUBLIC_ADSENSE_CLIENT and NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE are set
 * and the article is long enough.
 */
export default function AdSlot({ wordCount }: AdSlotProps) {
  const client = getAdsenseClient();
  const slot = getArticleSlot();
  const eligible = Boolean(client && slot) && wordCount >= MIN_AD_WORDS;

  useEffect(() => {
    if (!eligible) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // Ad blockers or script load failures must never affect the article.
    }
  }, [eligible]);

  if (!eligible) return null;

  return (
    <aside
      aria-label="Advertisement"
      data-testid="ad-slot"
      className="my-10 overflow-hidden rounded border border-slate-800 bg-slate-900/40 px-2 pb-2 pt-1"
      style={{ minHeight: AD_SLOT_MIN_HEIGHT }}
    >
      <p className="mb-1 text-center text-[11px] uppercase tracking-wider text-slate-500">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: AD_SLOT_MIN_HEIGHT - 28 }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
