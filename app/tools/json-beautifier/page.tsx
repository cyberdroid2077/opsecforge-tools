import JsonBeautifierTool from '@/components/JsonBeautifierTool';
import JsonBeautifierGuide from '@/components/tool-content/JsonBeautifierGuide';

export default function JsonBeautifierPage() {
  return (
    <JsonBeautifierTool breadcrumbLabel="JSON Beautifier">
      <JsonBeautifierGuide />
    </JsonBeautifierTool>
  );
}
