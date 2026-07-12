import { MetadataRoute } from 'next';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = 'https://www.opsecforge.com';

function listBlogRoutes() {
  const blogDirectory = path.join(process.cwd(), 'content/blog');

  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  return fs
    .readdirSync(blogDirectory)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => `/blog/${fileName.replace(/\.md$/, '')}`);
}

function listToolRoutes() {
  const toolsDirectory = path.join(process.cwd(), 'app/tools');

  if (!fs.existsSync(toolsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(toolsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(toolsDirectory, entry.name, 'page.tsx')))
    .map((entry) => `/tools/${entry.name}`);
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
    '/blog',
  ];

  const routes = Array.from(new Set([
    ...staticRoutes,
    ...listBlogRoutes(),
    ...listToolRoutes(),
  ])).sort((left, right) => {
    if (left === '') {
      return -1;
    }

    if (right === '') {
      return 1;
    }

    return left.localeCompare(right);
  });

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : route.startsWith('/tools/') ? 0.9 : 0.8,
  }));
}
