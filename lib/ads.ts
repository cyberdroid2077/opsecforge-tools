/**
 * Advertising configuration. Everything is driven by environment variables so that
 * a build without them contains no ad script and no ad markup.
 *
 *   NEXT_PUBLIC_ADSENSE_CLIENT        publisher id, "ca-pub-..." (script + ad units)
 *   NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE  ad unit id for the in-article slot
 */

/** Ads appear only on articles with at least this many words of body text. */
export const MIN_AD_WORDS = 900;

/** Reserved height (px) for the in-article ad box; keeps layout stable (CLS). */
export const AD_SLOT_MIN_HEIGHT = 280;

const CLIENT_PATTERN = /^ca-pub-\d+$/;

export function getAdsenseClient(): string | undefined {
  const value = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  return value && CLIENT_PATTERN.test(value) ? value : undefined;
}

export function getArticleSlot(): string | undefined {
  const value = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE?.trim();
  return value && /^\d+$/.test(value) ? value : undefined;
}

export function getAdsenseScriptSrc(client: string): string {
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
}

/** Counts words in rendered article HTML (tags and code blocks excluded). */
export function countWordsInHtml(html: string): number {
  const text = html
    .replace(/<(pre|script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[#a-z0-9]+;/gi, ' ');
  const words = text.match(/\S+/g);
  return words ? words.length : 0;
}
