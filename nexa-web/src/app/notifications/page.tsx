'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Bell, Check, CheckCircle2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils/date';
import { toast } from '@/hooks/use-toast';
import type { NotificationDto } from '@/lib/types/api';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { status } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', page, unreadOnly],
    queryFn: () => notificationsApi.list({ page, pageSize: 20, unreadOnly }),
    enabled: status === 'authenticated',
  });

  const markAsReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });

  const markAllAsReadMut = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast({ title: 'Đã đánh dấu tất cả là đã đọc' });
    },
  });

  const deleteOneMut = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast({ title: 'Đã xóa thông báo' });
    },
  });

  const deleteReadMut = useMutation({
    mutationFn: () => notificationsApi.deleteRead(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast({ title: `Đã dọn dẹp ${res.count} thông báo đã đọc` });
    },
  });

  const handleNotificationClick = (notif: NotificationDto) => {
    if (!notif.isRead) {
      markAsReadMut.mutate(notif.id);
    }
    if ((notif.type === 'ArticleReviewApproved' || notif.type === 'ArticleReviewRejected') && notif.articleId) {
      router.push(`/editor/${notif.articleId}`);
      return;
    }
    if (notif.articleSlug) {
      router.push(`/articles/${notif.articleSlug}${notif.commentId ? `#comment-${notif.commentId}` : ''}`);
    } else if (notif.articleId) {
      router.push(`/articles/${notif.articleId}`);
    }
  };

  if (status === 'loading' || isLoading) return <PageLoader />;
  if (status === 'unauthenticated') {
    return (
      <EmptyState
        title="Yêu cầu đăng nhập"
        description="Bạn cần đăng nhập để xem thông báo."
        action={<Button asChild className="rounded-xl"><Link href="/login">Đăng nhập ngay</Link></Button>}
      />
    );
  }
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
            <p className="text-xs text-muted-foreground">Cập nhật tương tác bài viết và tài khoản</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => { setUnreadOnly(false); setPage(1); }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                !unreadOnly ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => { setUnreadOnly(true); setPage(1); }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                unreadOnly ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chưa đọc
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => markAllAsReadMut.mutate()} disabled={markAllAsReadMut.isPending} className="rounded-xl text-xs">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Đã đọc tất cả
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => deleteReadMut.mutate()} 
            disabled={deleteReadMut.isPending} 
            className="rounded-xl text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Dọn dẹp đã đọc
          </Button>
        </div>
      </div>

      {data?.items.length ? (
        <div className="space-y-6">
          <div className="space-y-3">
            {data.items.map((notif) => (
              <div 
                key={notif.id}
                className={`group flex items-center justify-between gap-4 p-4 rounded-2xl border transition-colors ${
                  notif.isRead ? 'bg-card border-border/40 opacity-75' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                }`}
              >
                <div 
                  onClick={() => handleNotificationClick(notif)}
                  className="flex items-start gap-4 flex-1 cursor-pointer"
                >
                  <div className="mt-1">
                    {notif.isRead ? (
                      <Check className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground font-medium">{notif.message}</p>
                    <p className="text-xs text-muted-foreground font-mono">{timeAgo(notif.createdAtUtc)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  title="Xóa thông báo này"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOneMut.mutate(notif.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
        <div className="text-center py-20 rounded-2xl border border-dashed border-border/70">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">Chưa có thông báo nào</h3>
          <p className="text-muted-foreground text-xs">Bạn đã xem hết mọi thông báo trên Nexa.</p>
        </div>
      )}
    </div>
  );
}
