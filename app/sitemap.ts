import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://opsecforge.com';
  
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/faq',
    '/glossary',
    '/case-studies',
    '/blog',
    '/blog/ai-opsec-checklist-how-to-use-llms-safely',
    '/blog/global-privacy-compliance-guide-2026',
    '/blog/how-to-safely-share-env-files',
    '/blog/stop-pasting-sensitive-json-online',
    '/tools/jwt-decoder',
    '/tools/json-formatter',
    '/tools/env-sanitizer',
    '/tools/webhook-debugger',
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
