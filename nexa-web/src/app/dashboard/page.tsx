'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { articlesApi } from '@/lib/api/articles';
import { accountApi } from '@/lib/api/account';
import { useAuthStore } from '@/lib/stores/auth.store';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { 
  PenTool, 
  Settings, 
  FileText, 
  CheckCircle2, 
  Archive, 
  Edit3, 
  LayoutDashboard,
  Eye,
  Heart,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Library,
  Bookmark,
  Hash,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { user, status } = useAuthStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Published' | 'Archived'>('All');

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => accountApi.getStats(),
    enabled: !!user,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['my-articles', page, statusFilter],
    queryFn: () => articlesApi.listMine({ 
      page, 
      pageSize: 18, 
      status: statusFilter === 'All' ? undefined : statusFilter 
    }),
    enabled: !!user,
  });

  if (status === 'loading') return <PageLoader />;
  
  if (status === 'unauthenticated') {
    return (
      <EmptyState 
        title="Yêu cầu đăng nhập" 
        description="Vui lòng đăng nhập để truy cập trang quản lý bài viết của bạn." 
        action={
          <Button asChild className="rounded-xl">
            <Link href="/login">Đăng nhập ngay</Link>
          </Button>
        } 
      />
    );
  }

  const allItems = data?.items ?? [];

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">
      
      {/* Dashboard Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Tác giả
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Bảng điều khiển của {user?.profile.displayName}
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản lý bài viết, trạng thái xuất bản, thư viện media và chỉ số tương tác
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="rounded-xl border-border/80 hover:bg-muted text-xs">
            <Link href="/dashboard/media">
              <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Thư viện Media
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-border/80 hover:bg-muted text-xs">
            <Link href="/dashboard/series">
              <Library className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Series
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-border/80 hover:bg-muted text-xs">
            <Link href="/dashboard/profile">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Sửa hồ sơ
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm text-xs">
            <Link href="/editor/new">
              <PenTool className="h-3.5 w-3.5 mr-1.5" />
              Soạn bài mới
            </Link>
          </Button>
        </div>
      </div>

      {/* Engagement & Community Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Tổng lượt xem</span>
            <Eye className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            {stats?.views?.toLocaleString() ?? 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Lượt thích</span>
            <Heart className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {stats?.likes ?? 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Bình luận</span>
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            {stats?.comments ?? 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Người theo dõi</span>
            <Users className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            {stats?.followers ?? 0}
          </div>
        </div>

        <Link href="/dashboard/following-tags" className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors shadow-xs flex flex-col justify-between group">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium group-hover:text-primary transition-colors">
            <span>Thẻ theo dõi</span>
            <Hash className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            {stats?.followingTags ?? 0}
          </div>
        </Link>

        <Link href="/dashboard/bookmarks" className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors shadow-xs flex flex-col justify-between group">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium group-hover:text-primary transition-colors">
            <span>Đã lưu</span>
            <Bookmark className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            {stats?.bookmarks ?? 0}
          </div>
        </Link>
      </div>

      {/* Article Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => { setStatusFilter('All'); setPage(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'All' 
              ? 'bg-primary text-primary-foreground shadow-xs' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Tất cả ({stats?.articles ?? data?.totalCount ?? 0})
        </button>

        <button
          onClick={() => { setStatusFilter('Published'); setPage(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'Published' 
              ? 'bg-emerald-600 text-white shadow-xs' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Đã xuất bản ({stats?.publishedArticles ?? 0})
        </button>

        <button
          onClick={() => { setStatusFilter('Draft'); setPage(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'Draft' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Bản nháp ({stats?.draftArticles ?? 0})
        </button>

        <button
          onClick={() => { setStatusFilter('Archived'); setPage(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'Archived' 
              ? 'bg-muted text-foreground shadow-xs border border-border' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          Lưu trữ
        </button>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : allItems.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allItems.map((article) => (
              <ArticleCard key={article.id} article={article} showStatus />
            ))}
          </div>

          {data && data.totalCount > 18 && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              onPageChange={setPage}
            />
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Không có bài viết nào</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {statusFilter === 'Draft' 
              ? 'Bạn không có bản nháp nào đang dở dang.'
              : statusFilter === 'Published'
              ? 'Bạn chưa xuất bản bài viết nào ra cộng đồng.'
              : 'Hãy bắt đầu chia sẻ kiến thức đầu tiên của bạn lên Nexa ngay hôm nay.'}
          </p>
          <Button asChild size="sm" className="rounded-xl mt-2 text-xs">
            <Link href="/editor/new">Viết bài mới ngay</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
