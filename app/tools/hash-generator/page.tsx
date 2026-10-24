import SecureHashGenerator from '@/components/Tool-HashGenerator';
import HashGeneratorGuide from '@/components/tool-content/HashGeneratorGuide';

export default function HashGeneratorPage() {
  return (
    <>
      <SecureHashGenerator />
      <div className="px-6">
        <HashGeneratorGuide />
      </div>
    </>
  );
}
