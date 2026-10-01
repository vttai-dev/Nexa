'use client';

import { useEffect, useRef } from 'react';
import { articlesApi } from '@/lib/api/articles';

export function ArticleViewTracker({ slug }: { slug: string }) {
  const recordedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (recordedSlug.current === slug) return;
    recordedSlug.current = slug;
    void articlesApi.recordView(slug).catch(() => {});
  }, [slug]);

  return null;
}
