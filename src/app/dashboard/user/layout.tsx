import { type Metadata } from 'next';
import { config } from '@/config';

export const metadata = {
  title: `Users | Dashboard | ${config.site.name}`,
} satisfies Metadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
} 