/**
 * lib/blog.test.ts
 * Tests for blog.ts utilities.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import { getAllPosts, getPostBySlug } from './blog';

// vi.mock calls are hoisted to the top of the file.
// After hoisting, the `import fs from 'node:fs'` above resolves
// to the object returned by the factory — so fs.existsSync IS a ViFn.
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
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const posts = getAllPosts();
      expect(posts).toEqual([]);
    });

    it('returns sorted posts from blog directory (newest first)', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['post-1.md', 'post-2.md'] as unknown as import('node:fs').Dirent[]);
      vi.mocked(fs.readFileSync).mockImplementation((path: string) => {
        if (path.endsWith('post-1.md')) {
          return '---\ntitle: Second Post\ndate: "2026-03-20"\ndescription: Desc 1\n---\nContent 1';
        }
        if (path.endsWith('post-2.md')) {
          return '---\ntitle: First Post\ndate: "2026-03-22"\ndescription: Desc 2\n---\nContent 2';
        }
        return '';
      });

      const posts = getAllPosts();
      expect(posts).toHaveLength(2);
      expect(posts[0].title).toBe('First Post');
      expect(posts[1].title).toBe('Second Post');
    });

    it('filters to only .md files', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(
        ['post-1.md', 'readme.txt', 'data.json'] as unknown as import('node:fs').Dirent[]
      );
      vi.mocked(fs.readFileSync).mockReturnValue(
        '---\ntitle: Test\ndate: "2026-03-22"\ndescription: Desc\n---\nContent'
      );

      const posts = getAllPosts();
      expect(posts).toHaveLength(1);
    });
  });

  describe('getPostBySlug', () => {
    it('returns null when post does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const post = await getPostBySlug('nonexistent');
      expect(post).toBeNull();
    });

    it('returns parsed post with contentHtml when post exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        '---\ntitle: Test Post\ndate: "2026-03-22"\ndescription: A test\n---\n# Hello\nWorld'
      );

      const post = await getPostBySlug('test-post');
      expect(post).not.toBeNull();
      expect(post!.title).toBe('Test Post');
      expect(post!.slug).toBe('test-post');
      expect(post!.contentHtml).toContain('<h1>');
    });

    it('falls back to slug for missing frontmatter title', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('---\n---\nContent');

      const post = await getPostBySlug('fallback-slug');
      expect(post!.title).toBe('fallback-slug');
    });
  });
});
