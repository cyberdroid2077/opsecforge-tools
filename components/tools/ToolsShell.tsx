'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import SocialShare from '@/components/ui/SocialShare';

export default function ToolsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const toolContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tool = pathname.split('/').filter(Boolean)[1];
    const toolContent = toolContentRef.current;

    if (!tool || !toolContent) {
      return;
    }

    let usedTracked = false;
    let copyTracked = false;

    const trackUse = (interaction: 'input' | 'button') => {
      if (usedTracked) {
        return;
      }

      usedTracked = true;
      track('tool_used', { tool, interaction });
    };

    const handleInput = (event: Event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        trackUse('input');
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const button = target.closest('button');

      if (!button || button.disabled) {
        return;
      }

      trackUse('button');

      if (!copyTracked && button.textContent?.toLowerCase().includes('copy')) {
        copyTracked = true;
        track('tool_result_copied', { tool });
      }
    };

    toolContent.addEventListener('input', handleInput);
    toolContent.addEventListener('click', handleClick);

    return () => {
      toolContent.removeEventListener('input', handleInput);
      toolContent.removeEventListener('click', handleClick);
    };
  }, [pathname]);

  return (
    <>
      <div ref={toolContentRef} className="contents">
        {children}
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="mt-12 mb-24 px-6">
          <SocialShare />
        </div>
      </div>
    </>
  );
}
