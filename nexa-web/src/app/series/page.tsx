'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { seriesApi } from '@/lib/api/series';
import { useAuthStore } from '@/lib/stores/auth.store';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Library, BookOpen, Plus, ArrowRight, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

export default function SeriesListPage() {
  const { user, status } = useAuthStore();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-series', page],
    queryFn: () => seriesApi.listMine({ page, pageSize: 12 }),
    enabled: status === 'authenticated',
  });

  if (status === 'loading') return <PageLoader />;

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            <Library className="w-3.5 h-3.5" />
            Chuỗi bài viết chuyên sâu
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Bộ sưu tập Series
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Tuyển tập các chuỗi bài học theo lộ trình, kiến trúc hệ thống và cẩm nang công nghệ.
          </p>
        </div>

        {status === 'authenticated' && (
          <Button asChild size="sm" className="rounded-xl text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/dashboard/series">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Quản lý Series của tôi
            </Link>
          </Button>
        )}
      </div>

      {status === 'unauthenticated' ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Library className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Khám phá Series bài viết</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Đăng nhập để xem và quản lý các series bài viết theo lộ trình học tập của bạn.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button asChild size="sm" className="rounded-xl text-xs">
              <Link href="/login">Đăng nhập ngay</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs border-border">
              <Link href="/articles">Xem dòng tin bài viết</Link>
            </Button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <ErrorState retry={() => refetch()} />
      ) : !data?.items.length ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Bạn chưa tạo Series nào</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tạo chuỗi bài viết đầu tiên để xâu chuỗi các bài học thành lộ trình kiến thức hoàn chỉnh.
          </p>
          <Button asChild size="sm" className="rounded-xl text-xs mt-2">
            <Link href="/dashboard/series">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tạo Series mới
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((s) => (
              <div
                key={s.id}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <BookOpen className="w-3.5 h-3.5" />
                      {s.articleCount} bài viết
                    </span>
                    <span>{formatDate(s.createdAtUtc)}</span>
                  </div>
                  <Link href={`/series/${s.slug}`} className="block">
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {s.title}
                    </h3>
                  </Link>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                </div>
                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                  <Link
                    href={`/series/${s.slug}`}
                    className="inline-flex items-center text-xs font-semibold text-primary hover:underline gap-1"
                  >
                    Xem lộ trình
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/dashboard/series"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Quản lý
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {data.totalCount > 12 && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
