import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PostgreSQL & MySQL Query Formatter',
  description: 'Format and minify PostgreSQL, MySQL, and Standard SQL locally in your browser. Adjust indentation, keyword case, and comma placement.',
  alternates: { canonical: '/tools/sql-formatter' },
  keywords: ['SQL formatter', 'SQL beautifier', 'format SQL', 'SQL indenter', 'SQL query formatter'],
  openGraph: {
    title: 'PostgreSQL & MySQL Query Formatter | OpsecForge',
    description: 'Format and minify PostgreSQL, MySQL, and Standard SQL locally in your browser.',
  },
};

export { default } from '../tool-layout';
