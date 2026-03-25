'use client';

import { Twitter, Linkedin } from 'lucide-react';
import { FaReddit, FaHackerNews } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SocialShare() {
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState('');
  
  useEffect(() => {
    // Set title after component mounts to ensure document.title is updated
    setPageTitle(document.title);
  }, []);

  const url = `https://opsecforge.com${pathname}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(pageTitle);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
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
        <FaReddit size={20} />
      </a>
      <a href={shareLinks.hackerNews} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
        <FaHackerNews size={20} />
      </a>
    </div>
  );
}
