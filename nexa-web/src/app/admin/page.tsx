'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, Eye, FileText, Flag, Heart, MessageCircle, Users } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { useAuthStore } from '@/lib/stores/auth.store';
import { isAdmin } from '@/lib/types/api';

const numberFormat = new Intl.NumberFormat('vi-VN');

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const admin = !!user && isAdmin(user.account.roles);
  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.getStats, enabled: admin });
  const activityQuery = useQuery({ queryKey: ['admin-recent-activity'], queryFn: () => adminApi.getRecentActivity(8), enabled: admin });

  if (!admin) return <ErrorState title="Chỉ dành cho Admin" message="Moderator có thể dùng các trang kiểm duyệt ở menu bên trái." />;

  if (statsQuery.isLoading || activityQuery.isLoading) return <PageLoader />;
  if (statsQuery.error || activityQuery.error || !statsQuery.data || !activityQuery.data) {
    return <ErrorState retry={() => { void statsQuery.refetch(); void activityQuery.refetch(); }} />;
  }

  const stats = statsQuery.data;
  const tiles = [
    { label: 'Tài khoản', value: stats.totalUsers, icon: Users, detail: `${stats.lockedUsers} đang bị khóa` },
    { label: 'Bài viết', value: stats.totalArticles, icon: FileText, detail: `${stats.publishedArticles} đã xuất bản · ${stats.draftArticles} bản nháp` },
    { label: 'Báo cáo chờ xử lý', value: stats.pendingReports, icon: Flag, detail: `${stats.totalReports} báo cáo tổng cộng` },
    { label: 'Lượt xem', value: stats.totalViews, icon: Eye, detail: `${stats.totalLikes} lượt thích` },
    { label: 'Bình luận', value: stats.totalComments, icon: MessageCircle, detail: `${stats.totalBookmarks} lượt lưu bài` },
    { label: 'Theo dõi', value: stats.totalFollows, icon: Heart, detail: `${stats.totalCategories} danh mục · ${stats.totalTags} thẻ` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Tổng quan hệ thống</h2>
          <p className="text-xs text-muted-foreground">Số liệu thời gian thực từ Nexa API</p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl border-border text-xs">
          <Link href="/admin/article-reviews">Hàng chờ duyệt bài</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, detail }) => (
          <Card key={label} className="rounded-2xl border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-foreground">{numberFormat.format(value)}</div>
              <p className="mt-1 text-[11px] text-muted-foreground font-mono">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activityQuery.data.articles.length === 0 && activityQuery.data.users.length === 0 && activityQuery.data.reports.length === 0 && (
            <p className="text-xs text-muted-foreground">Chưa có hoạt động mới.</p>
          )}
          {activityQuery.data.articles.map((article) => (
            <div key={article.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0">
              <Link href={`/articles/${article.slug}`} className="text-xs font-medium text-foreground hover:text-primary transition-colors">
                {article.title}
              </Link>
              <Badge variant="secondary" className="text-[10px]">{article.status}</Badge>
            </div>
          ))}
          {activityQuery.data.users.map((account) => (
            <div key={account.id} className="flex items-center justify-between gap-2 border-b border-border pb-3 last:border-0 text-xs text-foreground">
              <span>Người dùng mới <strong>{account.userName}</strong></span>
              <span className="text-[11px] text-muted-foreground font-mono">{new Date(account.createdAtUtc).toLocaleString('vi-VN')}</span>
            </div>
          ))}
          {activityQuery.data.reports.map((report) => (
            <div key={report.id} className="flex items-center justify-between gap-2 text-xs text-foreground">
              <span>Báo cáo {report.targetType.toLowerCase()} · {report.reason}</span>
              <Badge variant={report.status === 'Pending' ? 'destructive' : 'secondary'} className="text-[10px]">{report.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
