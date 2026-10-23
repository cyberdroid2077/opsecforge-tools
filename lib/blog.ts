import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

const postsDirectory = path.join(process.cwd(), 'content/blog');

// Every article is credited to the same editorial process, not to a person or a team.
// Front matter `author` values are ignored on purpose; see /editorial-policy.
export const EDITORIAL_AUTHOR_NAME = 'OpsecForge Editorial';
export const EDITORIAL_AUTHOR_PATH = '/editorial-policy';

export type FaqItem = {
  question: string;
  answer: string;
};

export type BlogPostMetadata = {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  description: string;
  author: string;
  authorUrl: string;
  category: string;
  sourceReviewed?: string;
  qualityReviewed?: string;
  primarySource?: string;
};

type BlogPost = BlogPostMetadata & {
  contentHtml: string;
  faqs?: FaqItem[];
};

export function getAllPosts(): BlogPostMetadata[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        title: String(data.title ?? slug),
        date: String(data.date ?? ''),
        updated: data.updated ? String(data.updated) : undefined,
        description: String(data.description ?? ''),
        author: EDITORIAL_AUTHOR_NAME,
    authorUrl: EDITORIAL_AUTHOR_PATH,
        category: String(data.category ?? 'Developer Security'),
        sourceReviewed: data.source_reviewed ? String(data.source_reviewed) : undefined,
        qualityReviewed: data.reviewed ? String(data.reviewed) : undefined,
        primarySource: data.primary_source ? String(data.primary_source) : undefined,
      };
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getReviewedPosts(): BlogPostMetadata[] {
  return getAllPosts().filter((post) => post.sourceReviewed || post.qualityReviewed);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const contentWithoutDuplicateTitle = content.replace(/^\s*#\s+.+\r?\n/, '');
  // remark-gfm: GitHub-flavored Markdown, so pipe tables and strikethrough render as HTML.
  const processedContent = await remark()
    .use(remarkGfm)
    .use(html, { sanitize: false })
    .process(contentWithoutDuplicateTitle);
  const contentHtml = processedContent
    .toString()
    .replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
    .replace(/<\/h1>/gi, '</h2>');

  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ''),
    updated: data.updated ? String(data.updated) : undefined,
    description: String(data.description ?? ''),
    author: EDITORIAL_AUTHOR_NAME,
    authorUrl: EDITORIAL_AUTHOR_PATH,
    category: String(data.category ?? 'Developer Security'),
    sourceReviewed: data.source_reviewed ? String(data.source_reviewed) : undefined,
    qualityReviewed: data.reviewed ? String(data.reviewed) : undefined,
    primarySource: data.primary_source ? String(data.primary_source) : undefined,
    contentHtml,
    faqs: (data.faqs as FaqItem[] | undefined) ?? [],
  };
}
