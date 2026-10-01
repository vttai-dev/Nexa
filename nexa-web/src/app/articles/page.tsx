'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { taxonomyApi } from '@/lib/api/taxonomy';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { Pagination } from '@/components/ui/pagination';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { PageLoader } from '@/components/ui/loading-spinner';
import { NexaApiError } from '@/lib/api/client';
import { Layers, Hash, Sparkles } from 'lucide-react';

function ArticlesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryId = searchParams.get('categoryId') ?? undefined;
  const tagId = searchParams.get('tagId') ?? undefined;
  const [page, setPage] = useState(1);

  const { data: articles, isLoading, error, refetch } = useQuery({
    queryKey: ['articles', { page, categoryId, tagId }],
    queryFn: () => articlesApi.list({ page, pageSize: 18, categoryId, tagId }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => taxonomyApi.listCategories({ pageSize: 100 }),
    staleTime: 5 * 60_000,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => taxonomyApi.listTags({ pageSize: 100 }),
    staleTime: 5 * 60_000,
  });

  const handleCategoryFilter = (id: string | undefined) => {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('categoryId', id);
    else params.delete('categoryId');
    params.delete('tagId');
    router.push(`/articles?${params.toString()}`);
  };

  const handleTagFilter = (id: string | undefined) => {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('tagId', id);
    else params.delete('tagId');
    params.delete('categoryId');
    router.push(`/articles?${params.toString()}`);
  };

  const selectedCategory = categories?.items.find((c) => c.id === categoryId);
  const selectedTag = tags?.items.find((t) => t.id === tagId);

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Kho tri thức
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {selectedCategory 
            ? `Danh mục: ${selectedCategory.name}` 
            : selectedTag 
            ? `Chủ đề: #${selectedTag.name}` 
            : 'Tất cả bài viết'}
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {selectedCategory?.description || 'Tuyển tập các bài viết kỹ thuật, kiến trúc phần mềm và bài học thực chiến.'}
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        {/* Categories Bar */}
        {categories && categories.items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Chuyên mục:
            </span>
            <button
              onClick={() => handleCategoryFilter(undefined)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                !categoryId && !tagId
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả
            </button>
            {categories.items.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCategoryFilter(categoryId === c.id ? undefined : c.id)}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                  categoryId === c.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Tag pills */}
        {tags && tags.items.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1 mr-1">
              <Hash className="w-3.5 h-3.5 text-primary" />
              Tags:
            </span>
            {tags.items.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTagFilter(tagId === t.id ? undefined : t.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-mono transition-all ${
                  tagId === t.id
                    ? 'bg-primary/20 text-primary border border-primary/40 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Stream */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border p-6 space-y-4 bg-card">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <div className="pt-4 border-t border-border flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Không thể tải bài viết"
          message={error instanceof NexaApiError ? error.message : 'Đã xảy ra lỗi không xác định'}
          retry={() => refetch()}
        />
      ) : !articles?.items.length ? (
        <EmptyState
          title="Không tìm thấy bài viết"
          description={categoryId || tagId ? 'Chưa có bài viết nào phù hợp với bộ lọc đã chọn.' : 'Chưa có bài viết nào được xuất bản.'}
        />
      ) : (
        <div className="space-y-8">
          <div className="text-xs font-mono text-muted-foreground">
            Hiển thị {articles.items.length} trên tổng số {articles.totalCount} bài viết
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination
            page={articles.page}
            pageSize={articles.pageSize}
            totalCount={articles.totalCount}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ArticlesContent />
    </Suspense>
  );
}
