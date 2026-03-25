'use client';

import { Twitter, Linkedin, Reddit } from 'lucide-react';
import { FaHackerNews } from 'react-icons/fa';

interface SocialShareProps {
  url: string;
  title: string;
  tags?: string[];
}

export default function SocialShare({ url, title, tags = [] }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const twitterTags = tags.join(',');

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${twitterTags}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    hackerNews: `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`,
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-slate-400">Share this:</span>
      <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
        <Twitter size={20} />
      </a>
      <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
        <Linkedin size={20} />
      </a>
      <a href={shareLinks.reddit} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
        <Reddit size={20} />
      </a>
      <a href={shareLinks.hackerNews} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
        <FaHackerNews size={20} />
      </a>
    </div>
  );
}
