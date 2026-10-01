'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { engagementApi } from '@/lib/api/engagement';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Bookmark } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import Link from 'next/link';

export default function BookmarksPage() {
  const [page, setPage] = useState(1);
  const { status } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-bookmarks', page],
    queryFn: () => engagementApi.myBookmarks({ page, pageSize: 12 }),
    enabled: status === 'authenticated',
  });

  if (isLoading || status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated') {
    return (
      <EmptyState
        title="Yêu cầu đăng nhập"
        description="Bạn cần đăng nhập để xem bài viết đã lưu."
        action={<Button asChild className="rounded-xl"><Link href="/login">Đăng nhập ngay</Link></Button>}
      />
    );
  }
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-border/60 pb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Bookmark className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bài viết đã lưu</h1>
          <p className="text-sm text-muted-foreground">Những bài viết bạn đã bookmark để đọc lại sau.</p>
        </div>
      </div>

      {data?.items.length ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            totalCount={data.totalCount}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <div className="text-center py-20">
          <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Chưa có bài viết nào</h3>
          <p className="text-muted-foreground text-sm">Bạn chưa lưu bài viết nào. Hãy khám phá và lưu lại những bài viết thú vị!</p>
        </div>
      )}
    </div>
  );
}
