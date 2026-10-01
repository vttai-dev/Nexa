'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { engagementApi } from '@/lib/api/engagement';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import Link from 'next/link';

export default function LikesPage() {
  const [page, setPage] = useState(1);
  const { status } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-likes', page],
    queryFn: () => engagementApi.myLikes({ page, pageSize: 12 }),
    enabled: status === 'authenticated',
  });

  if (isLoading || status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated') {
    return (
      <EmptyState
        title="Yêu cầu đăng nhập"
        description="Bạn cần đăng nhập để xem các bài viết đã thích."
        action={<Button asChild className="rounded-xl"><Link href="/login">Đăng nhập ngay</Link></Button>}
      />
    );
  }
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-border/60 pb-6">
        <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
          <Heart className="w-5 h-5 fill-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bài viết đã thích</h1>
          <p className="text-sm text-muted-foreground">Tất cả các bài viết bạn đã bày tỏ cảm xúc yêu thích.</p>
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
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Chưa thích bài viết nào</h3>
          <p className="text-muted-foreground text-sm">Hãy thả tim cho các bài viết hay để lưu vào danh sách yêu thích của bạn!</p>
        </div>
      )}
    </div>
  );
}
