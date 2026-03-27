'use client';

import { usePathname } from 'next/navigation';
import SocialShare from '@/components/ui/SocialShare';

export default function ToolsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {children}
      <div className="max-w-4xl mx-auto">
        <div className="mt-12 mb-24 px-6">
          <SocialShare />
        </div>
      </div>
    </>
  );
}
