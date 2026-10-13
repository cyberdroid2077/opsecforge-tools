import Link from 'next/link';
import {
  buildToolStructuredData,
  getToolByHref,
  toolDiscovery,
} from '../../lib/tool-discovery';

/**
 * Shared per-tool discovery block: WebApplication + BreadcrumbList JSON-LD and
 * a small "related guides / adjacent tools" section. Rendered once by the tools
 * shell for every indexable tool page, so individual page files stay untouched.
 */
export default function ToolDiscovery({ slug }: { slug: string }) {
  const structuredData = buildToolStructuredData(slug);
  const related = toolDiscovery[slug];

  if (!structuredData || !related) {
    return null;
  }

  const hasRelated = related.guides.length > 0 || related.tools.length > 0;

  return (
    <>
      {structuredData.map((item) => (
        <script
          key={item['@type']}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      {hasRelated && (
        <aside
          aria-labelledby="related-heading"
          className="mx-auto mt-16 max-w-4xl px-6"
          data-testid="tool-related"
        >
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 id="related-heading" className="text-lg font-bold text-slate-100">
              Related guides
            </h2>
            {related.guides.length > 0 && (
              <ul className="mt-4 space-y-3">
                {related.guides.map((guide) => (
                  <li key={guide.href} className="text-sm leading-6 text-slate-400">
                    <Link
                      href={guide.href}
                      className="font-semibold text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
                    >
                      {guide.title}
                    </Link>
                    {' — '}
                    {guide.note}
                  </li>
                ))}
              </ul>
            )}
            {related.tools.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-bold uppercase tracking-widest text-slate-500">
                  Adjacent tools
                </h3>
                <ul className="mt-3 space-y-3">
                  {related.tools.map((item) => {
                    const tool = getToolByHref(item.href);

                    return tool ? (
                      <li key={item.href} className="text-sm leading-6 text-slate-400">
                        <Link
                          href={item.href}
                          className="font-semibold text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
                        >
                          {tool.name}
                        </Link>
                        {' — '}
                        {item.note}
                      </li>
                    ) : null;
                  })}
                </ul>
              </>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
