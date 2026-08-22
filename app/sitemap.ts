import { MetadataRoute } from 'next';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = 'https://www.opsecforge.com';
const nonIndexableToolRoutes = new Set([
  '/tools/json-formatter',
  '/tools/lorem-ipsum',
  '/tools/markdown-to-html',
  '/tools/qr-generator',
  '/tools/sha256-hash',
  '/tools/text-case',
  '/tools/text-diff',
  '/tools/url-encoder',
  '/tools/word-counter',
]);

type SitemapRoute = {
  route: string;
  lastModified?: string;
};

function readContentMetadata(filePath: string) {
  const source = fs.readFileSync(filePath, 'utf8');
  const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/);

  if (!frontmatter) {
    return { reviewed: false };
  }

  const reviewed = /^(source_reviewed|reviewed):\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m.test(frontmatter[1]);

  for (const field of ['updated', 'reviewed', 'source_reviewed', 'date']) {
    const match = frontmatter[1].match(new RegExp(`^${field}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})["']?\\s*$`, 'm'));

    if (match) {
      return { reviewed, lastModified: match[1] };
    }
  }

  return { reviewed };
}

function listBlogRoutes(): SitemapRoute[] {
  const blogDirectory = path.join(process.cwd(), 'content/blog');

  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  return fs
    .readdirSync(blogDirectory)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const metadata = readContentMetadata(path.join(blogDirectory, fileName));
      return {
        route: `/blog/${fileName.replace(/\.md$/, '')}`,
        ...metadata,
      };
    })
    .filter((post) => post.reviewed)
    .map(({ route, lastModified }) => ({ route, lastModified }));
}

function listToolRoutes(): SitemapRoute[] {
  const toolsDirectory = path.join(process.cwd(), 'app/tools');

  if (!fs.existsSync(toolsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(toolsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(toolsDirectory, entry.name, 'page.tsx')))
    .map((entry) => `/tools/${entry.name}`)
    .filter((route) => !nonIndexableToolRoutes.has(route))
    .map((route) => ({ route }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/faq',
    '/glossary',
    '/case-studies',
    '/privacy',
    '/terms-of-service',
    '/tools',
    '/blog',
  ];

  const routes: SitemapRoute[] = [
    ...staticRoutes.map((route) => ({ route })),
    ...listBlogRoutes(),
    ...listToolRoutes(),
  ].sort((left, right) => {
    if (left.route === '') {
      return -1;
    }

    if (right.route === '') {
      return 1;
    }

    return left.route.localeCompare(right.route);
  });

  return routes.map(({ route, lastModified }) => ({
    url: `${baseUrl}${route}`,
    ...(lastModified ? { lastModified } : {}),
  }));
}
