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

export type BlogHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

type BlogPost = BlogPostMetadata & {
  contentHtml: string;
  headings: BlogHeading[];
  faqs?: FaqItem[];
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X';
      const code = isHex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
        return String.fromCodePoint(code);
      }
      return match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

function headingPlainText(innerHtml: string): string {
  return decodeEntities(innerHtml.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

const HEADING_PATTERN = /<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
const EXISTING_ID_PATTERN = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
const TOC_SKIP_PATTERN = /\sdata-toc-skip(?=[\s=/]|$)/i;

/**
 * Adds a stable, de-duplicated id to every <h2>/<h3> and returns the table of contents.
 * Existing ids are kept; headings with `data-toc-skip` get an id but are left out of `headings`.
 */
export function addHeadingAnchors(htmlInput: string): { html: string; headings: BlogHeading[] } {
  const used = new Set<string>();
  for (const match of htmlInput.matchAll(HEADING_PATTERN)) {
    const existing = EXISTING_ID_PATTERN.exec(match[2] ?? '');
    const existingId = existing ? (existing[1] ?? existing[2]) : '';
    if (existingId) {
      used.add(existingId);
    }
  }

  const headings: BlogHeading[] = [];
  const result = htmlInput.replace(
    HEADING_PATTERN,
    (_match, tag: string, attrs: string | undefined, inner: string) => {
      const attributes = attrs ?? '';
      const level = tag.toLowerCase() === 'h2' ? 2 : 3;
      const text = headingPlainText(inner);
      const existing = EXISTING_ID_PATTERN.exec(attributes);
      const existingId = existing ? (existing[1] ?? existing[2]) : '';

      let id = existingId;
      let openTag = `<${tag}${attributes}>`;
      if (!id) {
        const base = slugifyHeading(text);
        id = base;
        for (let n = 2; used.has(id); n += 1) {
          id = `${base}-${n}`;
        }
        used.add(id);
        openTag = `<${tag} id="${id}"${attributes}>`;
      }

      if (!TOC_SKIP_PATTERN.test(attributes)) {
        headings.push({ id, text, level });
      }
      return `${openTag}${inner}</${tag}>`;
    },
  );

  return { html: result, headings };
}

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
  const demotedHtml = processedContent
    .toString()
    .replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
    .replace(/<\/h1>/gi, '</h2>');
  const { html: contentHtml, headings } = addHeadingAnchors(demotedHtml);

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
    headings,
    faqs: (data.faqs as FaqItem[] | undefined) ?? [],
  };
}
