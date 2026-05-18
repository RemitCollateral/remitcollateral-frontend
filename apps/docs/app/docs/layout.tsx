import { DocsLayout } from 'fumadocs-ui/layout';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      nav={{ title: 'MergeLabs Docs' }}
      sidebar={{
        defaultOpenLevel: 0,
      }}
    >
      {children}
    </DocsLayout>
  );
}
