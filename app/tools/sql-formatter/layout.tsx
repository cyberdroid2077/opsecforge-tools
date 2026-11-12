import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PostgreSQL & MySQL Query Formatter',
  description: 'Format and minify SQL locally in your browser: one column per line, joins kept intact, CREATE TABLE split by column, PostgreSQL :: casts and ON CONFLICT handled. A text formatter, not a SQL parser.',
  alternates: { canonical: '/tools/sql-formatter' },
  keywords: ['SQL formatter', 'SQL beautifier', 'format SQL', 'SQL indenter', 'SQL query formatter'],
  openGraph: {
    title: 'PostgreSQL & MySQL Query Formatter | OpsecForge',
    description: 'Format and minify SQL queries locally in your browser. Text-based layout, not a SQL parser.',
  },
};

export { default } from '../tool-layout';
