import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import SocialShare from '@/components/ui/SocialShare';

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | OpSecForge Blog',
    };
  }

  return {
    title: `${post.title} | OpSecForge Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-300 lg:px-24">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-emerald-400"
        >
          <ArrowLeft size={16} />
          Back to Blog
        </Link>

        <header className="mb-10 border-b border-slate-800 pb-8">
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={16} />
            <span>{post.date}</span>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            {post.title}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            {post.description}
          </p>
        </header>

        <div
          className="space-y-6 leading-8 text-slate-300 [&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-4 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-100 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-100 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-100 [&_li]:ml-6 [&_li]:list-disc [&_p]:text-slate-300 [&_strong]:text-slate-100 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:bg-slate-800/50 [&_blockquote]:p-6 [&_blockquote]:rounded-r-lg [&_blockquote_p]:m-0 [&_blockquote_strong]:text-emerald-400"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <div className="mt-12 border-t border-slate-800 pt-8">
          <SocialShare />
        </div>
      </article>
    </main>
  );
}
