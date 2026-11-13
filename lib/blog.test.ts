/**
 * lib/blog.test.ts
 * Tests for blog.ts utilities.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import { addHeadingAnchors, getAllPosts, getPostBySlug, getReviewedPosts } from './blog';

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('node:path', () => ({
  default: { join: vi.fn((...args: string[]) => args.join('/')) },
  join: vi.fn((...args: string[]) => args.join('/')),
}));

describe('blog utilities', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReset();
    vi.mocked(fs.readdirSync).mockReset();
    vi.mocked(fs.readFileSync).mockReset();
  });

  describe('getAllPosts', () => {
    it('returns empty array when blog directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false as any);
      const posts = getAllPosts();
      expect(posts).toEqual([]);
    });

    it('returns sorted posts from blog directory (newest first)', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true as any);
      vi.mocked(fs.readdirSync).mockReturnValue(['post-1.md', 'post-2.md'] as any);
      vi.mocked(fs.readFileSync).mockImplementation((() => '') as any);

      // Override per-call
      vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
        if (String(path).endsWith('post-1.md')) {
          return '---\ntitle: Second Post\ndate: "2026-03-20"\ndescription: Desc 1\n---\nContent 1';
        }
        if (String(path).endsWith('post-2.md')) {
          return '---\ntitle: First Post\ndate: "2026-03-22"\ndescription: Desc 2\n---\nContent 2';
        }
        return '';
      }) as any);

      const posts = getAllPosts();
      expect(posts).toHaveLength(2);
      expect(posts[0].title).toBe('First Post');
      expect(posts[1].title).toBe('Second Post');
    });

    it('filters to only .md files', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true as any);
      vi.mocked(fs.readdirSync).mockReturnValue(['post-1.md', 'readme.txt', 'data.json'] as any);
      vi.mocked(fs.readFileSync).mockImplementation((() => '---\ntitle: Test\ndate: "2026-03-22"\ndescription: Desc\n---\nContent') as any);

      const posts = getAllPosts();
      expect(posts).toHaveLength(1);
    });
  });

  describe('getReviewedPosts', () => {
    it('only publishes posts with explicit source or quality review metadata', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true as any);
      vi.mocked(fs.readdirSync).mockReturnValue(['legacy.md', 'sourced.md', 'reviewed.md'] as any);
      vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
        if (String(path).endsWith('sourced.md')) {
          return '---\ntitle: Sourced\ndate: "2026-03-22"\ndescription: Desc\nsource_reviewed: "2026-08-21"\n---\nContent';
        }
        if (String(path).endsWith('reviewed.md')) {
          return '---\ntitle: Reviewed\ndate: "2026-03-21"\ndescription: Desc\nreviewed: "2026-08-20"\n---\nContent';
        }
        return '---\ntitle: Legacy\ndate: "2026-03-20"\ndescription: Desc\n---\nContent';
      }) as any);

      expect(getReviewedPosts().map((post) => post.title)).toEqual(['Sourced', 'Reviewed']);
    });
  });

  describe('getPostBySlug', () => {
    it('returns null when post does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false as any);
      const post = await getPostBySlug('nonexistent');
      expect(post).toBeNull();
    });

    it('returns parsed post content without duplicating the page H1', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true as any);
      vi.mocked(fs.readFileSync).mockImplementation((() =>
        '---\ntitle: Test Post\ndate: "2026-03-22"\ndescription: A test\n---\n# Hello\nWorld'
      ) as any);

      const post = await getPostBySlug('test-post');
      expect(post).not.toBeNull();
      expect(post!.title).toBe('Test Post');
      expect(post!.slug).toBe('test-post');
      expect(post!.contentHtml).not.toContain('<h1>');
      expect(post!.contentHtml).toContain('<p>World</p>');
      expect(post!.author).toBe('OpsecForge Editorial');
      expect(post!.authorUrl).toBe('/editorial-policy');
    });

    it('ignores a front matter author and credits the editorial process', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true as any);
      vi.mocked(fs.readFileSync).mockImplementation((() =>
        '---\ntitle: Signed Post\ndate: "2026-03-22"\ndescription: A test\nauthor: Someone Else\n---\nBody'
      ) as any);

      const post = await getPostBySlug('signed-post');
      expect(post!.author).toBe('OpsecForge Editorial');
      expect(post!.authorUrl).toBe('/editorial-policy');
    });

    it('demotes embedded HTML H1 headings and exposes review provenance', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true as any);
      vi.mocked(fs.readFileSync).mockImplementation((() =>
        '---\ntitle: Reviewed Post\ndate: "2026-03-22"\nupdated: "2026-07-24"\ndescription: A test\nsource_reviewed: "2026-07-24"\nprimary_source: "https://www.nist.gov/example"\n---\n<h1 class="legacy">Legacy heading</h1>\nBody'
      ) as any);

      const post = await getPostBySlug('reviewed-post');
      expect(post!.contentHtml).not.toContain('<h1');
      expect(post!.contentHtml).toContain('<h2 id="legacy-heading" class="legacy">Legacy heading</h2>');
      expect(post!.updated).toBe('2026-07-24');
      expect(post!.sourceReviewed).toBe('2026-07-24');
      expect(post!.primarySource).toBe('https://www.nist.gov/example');
    });

    it('falls back to slug for missing frontmatter title', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true as any);
      vi.mocked(fs.readFileSync).mockImplementation((() => '---\n---\nContent') as any);

      const post = await getPostBySlug('fallback-slug');
      expect(post!.title).toBe('fallback-slug');
    });
  });
});

describe('addHeadingAnchors', () => {
  it('adds ids to plain h2 and h3 headings and collects them', () => {
    const { html, headings } = addHeadingAnchors('<h2>Why It Matters</h2><p>x</p><h3>Step 1: Setup</h3>');
    expect(html).toBe('<h2 id="why-it-matters">Why It Matters</h2><p>x</p><h3 id="step-1-setup">Step 1: Setup</h3>');
    expect(headings).toEqual([
      { id: 'why-it-matters', text: 'Why It Matters', level: 2 },
      { id: 'step-1-setup', text: 'Step 1: Setup', level: 3 },
    ]);
  });

  it('keeps existing attributes on raw HTML headings', () => {
    const { html, headings } = addHeadingAnchors('<h2 class="m-0 text-2xl font-bold">Encoding Process</h2>');
    expect(html).toBe('<h2 id="encoding-process" class="m-0 text-2xl font-bold">Encoding Process</h2>');
    expect(headings).toEqual([{ id: 'encoding-process', text: 'Encoding Process', level: 2 }]);
  });

  it('strips inline tags and decodes entities for text and id', () => {
    const { html, headings } = addHeadingAnchors(
      '<h2>Use <code>fetch</code> &amp; <a href="/x">&lt;b&gt;</a> &quot;safely&quot; &#x27;now&#39;</h2>',
    );
    expect(headings).toEqual([
      { id: 'use-fetch-b-safely-now', text: 'Use fetch & <b> "safely" \'now\'', level: 2 },
    ]);
    expect(html).toContain('<h2 id="use-fetch-b-safely-now">Use <code>fetch</code>');
  });

  it('falls back to "section" when the text has no usable characters', () => {
    const { headings } = addHeadingAnchors('<h2>!!!</h2><h2>???</h2>');
    expect(headings.map((h) => h.id)).toEqual(['section', 'section-2']);
  });

  it('de-duplicates repeated headings with numeric suffixes', () => {
    const { headings } = addHeadingAnchors('<h2>Setup</h2><h3>Setup</h3><h2>Setup</h2>');
    expect(headings.map((h) => h.id)).toEqual(['setup', 'setup-2', 'setup-3']);
  });

  it('preserves existing ids and reserves them against later headings', () => {
    const { html, headings } = addHeadingAnchors('<h2>Overview</h2><h2 id="overview">Custom</h2>');
    expect(html).toContain('<h2 id="overview">Custom</h2>');
    expect(html).toContain('<h2 id="overview-2">Overview</h2>');
    expect(headings).toEqual([
      { id: 'overview-2', text: 'Overview', level: 2 },
      { id: 'overview', text: 'Custom', level: 2 },
    ]);
  });

  it('gives data-toc-skip headings an id but leaves them out of headings', () => {
    const { html, headings } = addHeadingAnchors(
      '<h2 data-toc-skip class="mt-0">Try it locally</h2><h2>Real Section</h2>',
    );
    expect(html).toContain('<h2 id="try-it-locally" data-toc-skip class="mt-0">Try it locally</h2>');
    expect(headings).toEqual([{ id: 'real-section', text: 'Real Section', level: 2 }]);
  });

  it('does not touch escaped headings inside code blocks', () => {
    const input = '<pre><code>&lt;h2&gt;Fake&lt;/h2&gt;</code></pre><h2>Real</h2>';
    const { html, headings } = addHeadingAnchors(input);
    expect(html).toBe('<pre><code>&lt;h2&gt;Fake&lt;/h2&gt;</code></pre><h2 id="real">Real</h2>');
    expect(headings).toHaveLength(1);
  });
});

describe('getPostBySlug headings', () => {
  function mockPost(body: string) {
    vi.mocked(fs.existsSync).mockReturnValue(true as any);
    vi.mocked(fs.readFileSync).mockReturnValue(
      `---\ntitle: Synthetic\ndate: "2026-01-01"\n---\n${body}` as any,
    );
  }

  it('adds ids to markdown headings and exposes them', async () => {
    mockPost('## First Part\n\ntext\n\n### Detail\n\nmore\n\n## Second Part\n');
    const post = await getPostBySlug('synthetic');
    expect(post!.contentHtml).toContain('<h2 id="first-part">First Part</h2>');
    expect(post!.contentHtml).toContain('<h3 id="detail">Detail</h3>');
    expect(post!.headings.map((h) => [h.level, h.id])).toEqual([
      [2, 'first-part'],
      [3, 'detail'],
      [2, 'second-part'],
    ]);
  });

  it('handles inline code and entities in markdown headings', async () => {
    mockPost('## Using `fetch` & more\n\ntext\n');
    const post = await getPostBySlug('synthetic');
    expect(post!.headings).toEqual([{ id: 'using-fetch-more', text: 'Using fetch & more', level: 2 }]);
  });

  it('gives demoted h1 headings an id', async () => {
    mockPost('<h1 class="legacy">Legacy heading</h1>\nBody');
    const post = await getPostBySlug('synthetic');
    expect(post!.contentHtml).toContain('<h2 id="legacy-heading" class="legacy">Legacy heading</h2>');
    expect(post!.headings).toEqual([{ id: 'legacy-heading', text: 'Legacy heading', level: 2 }]);
  });

  it('keeps toc-skip card headings out of headings and ignores code-block headings', async () => {
    mockPost(
      [
        '<div><h2 data-toc-skip class="mt-0">Try the tool</h2></div>',
        '',
        '## Real Section',
        '',
        '```html',
        '<h2>Not a heading</h2>',
        '```',
        '',
      ].join('\n'),
    );
    const post = await getPostBySlug('synthetic');
    expect(post!.headings.map((h) => h.id)).toEqual(['real-section']);
    // remark-html escapes only the opening angle bracket inside code.
    expect(post!.contentHtml).toContain('&#x3C;h2>Not a heading&#x3C;/h2>');
    expect(post!.contentHtml).not.toContain('id="not-a-heading"');
  });
});

describe("markdown rendering (GFM)", () => {
  it("renders pipe tables as HTML tables and keeps ordered lists ordered", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true as any);
    vi.mocked(fs.readFileSync).mockReturnValue(
      [
        "---",
        "title: Synthetic",
        "date: 2026-01-01",
        "---",
        "",
        "| Variant | Alphabet |",
        "|---|---|",
        "| Base64 | + and / |",
        "",
        "1. first",
        "2. second",
      ].join("\n") as any,
    );
    const post = await getPostBySlug("synthetic");
    expect(post).not.toBeNull();
    expect(post!.contentHtml).toContain("<table>");
    expect(post!.contentHtml).toContain("<td>Base64</td>");
    expect(post!.contentHtml).not.toMatch(/\|\s*-{3,}\s*\|/);
    expect(post!.contentHtml).toContain("<ol>");
  });
});
