'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, BookOpen, Users, Hash } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { useDebounce } from '@/hooks/use-debounce';
import { PageLoader } from '@/components/ui/loading-spinner';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch !== initialQuery) {
      const url = new URL(window.location.href);
      if (debouncedSearch) {
        url.searchParams.set('q', debouncedSearch);
      } else {
        url.searchParams.delete('q');
      }
      router.replace(url.pathname + url.search);
    }
  }, [debouncedSearch, initialQuery, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', debouncedSearch],
    queryFn: () => searchApi.searchAll({ query: debouncedSearch }),
    enabled: !!debouncedSearch,
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Tìm kiếm</h1>
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài viết, người dùng, tags..."
            className="pl-11 h-12 text-sm rounded-2xl border-border focus-visible:ring-primary"
          />
        </div>
      </div>

      {!debouncedSearch ? (
        <div className="text-center py-20 text-xs text-muted-foreground">
          Nhập từ khóa để bắt đầu tìm kiếm
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-xs text-destructive">
          Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Articles Section */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <BookOpen className="w-4 h-4 text-primary" />
              Bài viết ({data?.articles?.totalCount || 0})
            </h2>
            {data?.articles?.items.length ? (
              <div className="space-y-4">
                {data.articles.items.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="block p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <h3 className="font-bold text-sm text-foreground mb-1">{article.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{article.summary}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{article.authorName}</span>
                      <span>•</span>
                      <span>{formatDate(article.publishedAtUtc)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">Không tìm thấy bài viết nào.</p>
            )}
          </div>

          {/* Sidebar: Users & Tags */}
          <div className="space-y-8">
            {/* Users Section */}
            <div className="space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                <Users className="w-4 h-4 text-primary" />
                Người dùng ({data?.users?.totalCount || 0})
              </h2>
              {data?.users?.items.length ? (
                <div className="space-y-3">
                  {data.users.items.map((u) => (
                    <Link
                      key={u.userId}
                      href={`/u/${u.userName}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">{u.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-xs text-foreground truncate">{u.displayName}</div>
                        <div className="text-xs text-muted-foreground truncate font-mono">@{u.userName}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">Không tìm thấy người dùng nào.</p>
              )}
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                <Hash className="w-4 h-4 text-primary" />
                Chủ đề ({data?.tags?.totalCount || 0})
              </h2>
              {data?.tags?.items.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.tags.items.map((t) => (
                    <Link
                      key={t.id}
                      href={`/articles?tagId=${t.id}`}
                      className="px-3 py-1 rounded-lg border border-border bg-card hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-mono font-medium"
                    >
                      #{t.name} <span className="opacity-70 text-[10px] ml-1">({t.articleCount})</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">Không tìm thấy chủ đề nào.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SearchContent />
    </Suspense>
  );
}
