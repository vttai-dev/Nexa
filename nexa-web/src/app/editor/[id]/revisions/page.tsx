'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api/articles';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/date';
import { useAuthStore } from '@/lib/stores/auth.store';
import { canAuthor } from '@/lib/types/api';

export default function ArticleRevisionsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, status } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-article-revisions', id],
    queryFn: () => articlesApi.listRevisions(id, { page: 1, pageSize: 50 }),
    enabled: status === 'authenticated' && user !== null && canAuthor(user.account.roles),
  });

  if (status === 'loading' || isLoading) return <PageLoader />;
  if (status === 'unauthenticated') {
    return (
      <EmptyState
        title="Yêu cầu đăng nhập"
        description="Bạn cần đăng nhập để xem lịch sử chỉnh sửa."
        action={<Button asChild className="rounded-xl"><Link href="/login">Đăng nhập ngay</Link></Button>}
      />
    );
  }
  if (user && !canAuthor(user.account.roles)) {
    return <EmptyState title="Chỉ dành cho tác giả" description="Hãy đăng ký quyền tác giả để xem lịch sử bài viết." action={<Button asChild><Link href="/author-registration">Đăng ký tác giả</Link></Button>} />;
  }
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/70">
        <Button asChild variant="ghost" size="icon" className="rounded-xl">
          <Link href={`/editor/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Lịch sử chỉnh sửa
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">Bài viết: {id}</p>
        </div>
      </div>

      {data?.items.length ? (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Hành động</th>
                <th className="px-6 py-4 font-semibold">Tiêu đề</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.items.map((rev) => (
                <tr 
                  key={rev.id} 
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/editor/${id}/revisions/${rev.id}`)}
                >
                  <td className="px-6 py-4 font-medium text-foreground">{rev.action}</td>
                  <td className="px-6 py-4 max-w-[200px] truncate">{rev.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                      {rev.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(rev.createdAtUtc)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          Chưa có lịch sử chỉnh sửa nào.
        </div>
      )}
    </div>
  );
}
