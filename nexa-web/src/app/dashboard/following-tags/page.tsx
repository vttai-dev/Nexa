'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { engagementApi } from '@/lib/api/engagement';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { FollowTagButton } from '@/components/tags/FollowTagButton';
import { Hash, BookOpen, Users, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FollowingTagsPage() {
  const [page, setPage] = useState(1);
  const { status } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [router, status]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['following-tags', page],
    queryFn: () => engagementApi.listFollowingTags({ page, pageSize: 18 }),
    enabled: status === 'authenticated',
  });

  if (status === 'loading' || isLoading) return <PageLoader />;
  if (status === 'unauthenticated') return null;
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Thẻ đang theo dõi</h1>
            <p className="text-xs text-muted-foreground">Các chủ đề kỹ thuật bạn đã đăng ký theo dõi</p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/articles">Khám phá thêm thẻ</Link>
        </Button>
      </div>

      {data?.items.length ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((tag) => (
              <div 
                key={tag.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs"
              >
                <Link 
                  href={`/articles?tagId=${tag.id}`} 
                  className="space-y-1 hover:text-primary transition-colors flex-1 min-w-0 pr-3"
                >
                  <div className="font-bold text-base flex items-center gap-1 truncate">
                    <Hash className="w-4 h-4 text-primary shrink-0" />
                    <span>{tag.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {tag.publishedArticleCount} bài viết
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {tag.followerCount} theo dõi
                    </span>
                  </div>
                </Link>

                <FollowTagButton 
                  tagId={tag.id} 
                  tagName={tag.name} 
                  isInitiallyFollowing={true} 
                />
              </div>
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
        <EmptyState
          title="Chưa theo dõi thẻ nào"
          description="Bạn chưa theo dõi chủ đề nào. Hãy theo dõi các thẻ bạn yêu thích để cập nhật bài viết mới."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/articles">Khám phá bài viết & chủ đề</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
