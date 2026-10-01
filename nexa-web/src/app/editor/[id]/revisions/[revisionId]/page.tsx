'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api/articles';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, RotateCcw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/date';
import { ArticleMarkdown } from '@/app/articles/[slug]/ArticleMarkdown';
import { useAuthStore } from '@/lib/stores/auth.store';
import { canAuthor } from '@/lib/types/api';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RevisionDetailPage({ params }: { params: Promise<{ id: string, revisionId: string }> }) {
  const { id, revisionId } = use(params);
  const { user, status } = useAuthStore();
  const router = useRouter();
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  const { data: rev, isLoading, error, refetch } = useQuery({
    queryKey: ['my-article-revision', id, revisionId],
    queryFn: () => articlesApi.getRevision(id, revisionId),
    enabled: status === 'authenticated' && user !== null && canAuthor(user.account.roles),
  });

  const { data: currentArticle } = useQuery({
    queryKey: ['my-article', id],
    queryFn: () => articlesApi.getMine(id),
    enabled: status === 'authenticated' && user !== null && canAuthor(user.account.roles),
  });

  const restoreMutation = useMutation({
    mutationFn: () => {
      if (!currentArticle) throw new Error('Không thể tìm thấy bài viết hiện tại');
      return articlesApi.restoreRevision(id, revisionId, currentArticle.version);
    },
    onSuccess: () => {
      toast({ title: 'Đã khôi phục phiên bản thành công', description: 'Nội dung bài viết đã được cập nhật về phiên bản này.' });
      router.push(`/editor/${id}`);
    },
    onError: (e: any) => {
      setRestoreConfirmOpen(false);
      toast({ title: 'Lỗi khôi phục', description: e.title || 'Phiên bản bài viết đã thay đổi', variant: 'destructive' });
    }
  });

  if (status === 'loading' || isLoading) return <PageLoader />;
  if (status === 'unauthenticated') {
    return (
      <EmptyState
        title="Yêu cầu đăng nhập"
        description="Bạn cần đăng nhập để xem chi tiết phiên bản."
        action={<Button asChild className="rounded-xl"><Link href="/login">Đăng nhập ngay</Link></Button>}
      />
    );
  }
  if (user && !canAuthor(user.account.roles)) {
    return <EmptyState title="Chỉ dành cho tác giả" description="Hãy đăng ký quyền tác giả để xem và khôi phục phiên bản bài viết." action={<Button asChild><Link href="/author-registration">Đăng ký tác giả</Link></Button>} />;
  }
  if (error || !rev) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl">
            <Link href={`/editor/${id}/revisions`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Chi tiết phiên bản lịch sử</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span className="font-mono">Phiên bản ID: {revisionId}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(rev.createdAtUtc)}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setRestoreConfirmOpen(true)}
          className="rounded-xl gap-2 font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Khôi phục phiên bản này
        </Button>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Tiêu đề</div>
            <div className="text-xl font-bold">{rev.title}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Slug</div>
            <div className="font-mono text-sm">{rev.slug}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Tóm tắt</div>
            <div className="text-sm">{rev.summary || <span className="italic text-muted-foreground">Không có</span>}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-10 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Nội dung</div>
          {rev.bodyMarkdown ? (
            <ArticleMarkdown markdown={rev.bodyMarkdown} />
          ) : (
            <div className="text-sm text-muted-foreground italic">Không có nội dung.</div>
          )}
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục nội dung về phiên bản này?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ tiêu đề, slug, tóm tắt và nội dung Markdown của bài viết sẽ được ghi đè bằng snapshot của phiên bản đã chọn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <Button
              disabled={restoreMutation.isPending}
              onClick={() => restoreMutation.mutate()}
            >
              {restoreMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xác nhận khôi phục
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
