import SocialShare from '@/components/ui/SocialShare';

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
