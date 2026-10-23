import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PostgreSQL & MySQL Query Formatter',
  description: 'Format and minify SQL queries locally in your browser, with one column per line and joins kept intact. Adjust indentation, keyword case, and comma placement. A text formatter, not a SQL parser.',
  alternates: { canonical: '/tools/sql-formatter' },
  keywords: ['SQL formatter', 'SQL beautifier', 'format SQL', 'SQL indenter', 'SQL query formatter'],
  openGraph: {
    title: 'PostgreSQL & MySQL Query Formatter | OpsecForge',
    description: 'Format and minify SQL queries locally in your browser. Text-based layout, not a SQL parser.',
  },
};

export { default } from '../tool-layout';
