import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lorem Ipsum Generator - Generate Placeholder Text',
  description: 'Free Lorem Ipsum generator. Create placeholder text for designs and prototypes with customizable word and paragraph counts.',
  alternates: { canonical: '/tools/lorem-ipsum' },
  keywords: ['Lorem Ipsum generator', 'placeholder text', 'lorem ipsum', 'dummy text', 'sample text'],
  openGraph: {
    title: 'Lorem Ipsum Generator - Generate Placeholder Text | OpsecForge',
    description: 'Free Lorem Ipsum generator for browser-based placeholder text.',
  },
};

export { default } from '../tool-layout';
