/**
 * lib/blog.test.ts
 * Tests for blog.ts utilities.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import { getAllPosts, getPostBySlug } from './blog';

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

  describe('getPostBySlug', () => {
    it('returns null when post does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false as any);
      const post = await getPostBySlug('nonexistent');
      expect(post).toBeNull();
    });

    it('returns parsed post with contentHtml when post exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true as any);
      vi.mocked(fs.readFileSync).mockImplementation((() =>
        '---\ntitle: Test Post\ndate: "2026-03-22"\ndescription: A test\n---\n# Hello\nWorld'
      ) as any);

      const post = await getPostBySlug('test-post');
      expect(post).not.toBeNull();
      expect(post!.title).toBe('Test Post');
      expect(post!.slug).toBe('test-post');
      expect(post!.contentHtml).toContain('<h1>');
    });

    it('falls back to slug for missing frontmatter title', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true as any);
      vi.mocked(fs.readFileSync).mockImplementation((() => '---\n---\nContent') as any);

      const post = await getPostBySlug('fallback-slug');
      expect(post!.title).toBe('fallback-slug');
    });
  });
});
