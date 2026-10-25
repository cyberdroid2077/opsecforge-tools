import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdSlot from '@/components/AdSlot';
import PrivacyPage from '@/app/privacy/page';
import { AD_SLOT_MIN_HEIGHT, MIN_AD_WORDS, countWordsInHtml, getAdsenseScriptSrc } from '@/lib/ads';

const SYNTHETIC_CLIENT = 'ca-pub-0000000000000000';
const SYNTHETIC_SLOT = '1111111111';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function enableAds() {
  vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT', SYNTHETIC_CLIENT);
  vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE', SYNTHETIC_SLOT);
}

describe('AdSlot', () => {
  it('renders nothing for a short article even when configured', () => {
    enableAds();
    const { container } = render(<AdSlot wordCount={MIN_AD_WORDS - 1} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when the client env var is not set', () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT', '');
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE', SYNTHETIC_SLOT);
    const { container } = render(<AdSlot wordCount={5000} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when the slot env var is not set', () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT', SYNTHETIC_CLIENT);
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE', '');
    const { container } = render(<AdSlot wordCount={5000} />);
    expect(container.innerHTML).toBe('');
  });

  it('ignores a malformed client id', () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT', '"><script>');
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE', SYNTHETIC_SLOT);
    const { container } = render(<AdSlot wordCount={5000} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a labelled box with reserved height for a long article', () => {
    enableAds();
    render(<AdSlot wordCount={MIN_AD_WORDS} />);
    const box = screen.getByTestId('ad-slot');
    expect(box.style.minHeight).toBe(`${AD_SLOT_MIN_HEIGHT}px`);
    expect(box.textContent).toContain('Advertisement');
    const ins = box.querySelector('ins.adsbygoogle');
    expect(ins?.getAttribute('data-ad-client')).toBe(SYNTHETIC_CLIENT);
    expect(ins?.getAttribute('data-ad-slot')).toBe(SYNTHETIC_SLOT);
  });
});

describe('Privacy page advertising section', () => {
  it('says no ads are served when the client env var is not set', () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_CLIENT', '');
    render(<PrivacyPage />);
    expect(document.body.textContent).toContain('does not serve advertisements');
    expect(document.body.textContent).not.toContain('consent management platform');
  });

  it('describes AdSense cookies and the consent message when ads are enabled', () => {
    enableAds();
    render(<PrivacyPage />);
    expect(document.body.textContent).toContain('Google AdSense');
    expect(document.body.textContent).toContain('consent management platform');
    expect(document.body.textContent).not.toContain('does not serve advertisements');
  });
});

describe('ads helpers', () => {
  it('counts words outside tags and code blocks', () => {
    const html = '<h2>Title here</h2><p>one two &amp; three</p><pre><code>ignored code block</code></pre>';
    expect(countWordsInHtml(html)).toBe(5);
  });

  it('builds the AdSense script URL from the client id', () => {
    expect(getAdsenseScriptSrc(SYNTHETIC_CLIENT)).toBe(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000',
    );
  });
});
