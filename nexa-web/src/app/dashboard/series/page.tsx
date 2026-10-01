'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesApi } from '@/lib/api/series';
import { useAuthStore } from '@/lib/stores/auth.store';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/hooks/use-toast';
import { toSlug } from '@/lib/utils/slug';
import { 
  Library, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  BookOpen, 
  ExternalLink 
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ArticleSeriesSummaryDto } from '@/lib/types/api';
import { canAuthor } from '@/lib/types/api';

export default function SeriesManagementPage() {
  const { user, status } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<ArticleSeriesSummaryDto | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  // Delete state
  const [deletingSeries, setDeletingSeries] = useState<ArticleSeriesSummaryDto | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-series', page],
    queryFn: () => seriesApi.listMine({ page, pageSize: 12 }),
    enabled: status === 'authenticated',
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { title, slug, description };
      if (editingSeries) {
        await seriesApi.update(editingSeries.id, payload);
      } else {
        await seriesApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-series'] });
      toast({ title: editingSeries ? 'Cập nhật series thành công' : 'Tạo series mới thành công' });
      handleCloseModal();
    },
    onError: (e: any) => {
      toast({ title: 'Lỗi', description: e.title || 'Vui lòng kiểm tra slug hoặc tiêu đề', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => seriesApi.delete(id),
    onSuccess: () => {
      setDeletingSeries(null);
      queryClient.invalidateQueries({ queryKey: ['my-series'] });
      toast({ title: 'Đã xóa series' });
    },
    onError: (e: any) => {
      setDeletingSeries(null);
      toast({ title: 'Lỗi khi xóa series', description: e.title, variant: 'destructive' });
    }
  });

  const handleOpenCreate = () => {
    setEditingSeries(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (s: ArticleSeriesSummaryDto) => {
    setEditingSeries(s);
    setTitle(s.title);
    setSlug(s.slug);
    setDescription(s.description);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSeries(null);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingSeries) {
      setSlug(toSlug(val));
    }
  };

  if (status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated') {
    return <EmptyState title="Yêu cầu đăng nhập" description="Vui lòng đăng nhập để quản lý series bài viết." />;
  }
  if (user && !canAuthor(user.account.roles)) {
    return <EmptyState title="Đăng ký quyền tác giả" description="Thư viện series chỉ dành cho tác giả." action={<Button asChild><Link href="/author-registration">Đăng ký làm tác giả</Link></Button>} />;
  }

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState retry={() => refetch()} />;

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Series Bài viết</h1>
            <p className="text-xs text-muted-foreground">Tập hợp các bài viết kỹ thuật liên quan thành lộ trình học tập</p>
          </div>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl gap-2 font-medium">
          <Plus className="w-4 h-4" />
          Tạo Series mới
        </Button>
      </div>

      {/* Series Grid */}
      {data?.items.length ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((series) => (
              <div
                key={series.id}
                className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {series.articleCount} bài viết
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      /{series.slug}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-foreground line-clamp-1">
                    {series.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {series.description || 'Chưa có mô tả cho series này.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1.5 text-primary">
                    <Link href={`/series/${series.slug}`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                      Xem công khai
                    </Link>
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(series)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingSeries(series)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
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
          title="Chưa có Series bài viết nào"
          description="Tạo chuỗi bài viết liên kết theo chủ đề để giúp độc giả dễ dàng tiếp cận kiến thức."
          action={
            <Button onClick={handleOpenCreate} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Tạo Series đầu tiên
            </Button>
          }
        />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSeries ? 'Chỉnh sửa Series' : 'Tạo Series bài viết mới'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim() && slug.trim()) saveMutation.mutate();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label>Tiêu đề Series</Label>
              <Input
                placeholder="VD: Làm chủ PostgreSQL từ cơ bản đến nâng cao"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Đường dẫn Slug</Label>
              <Input
                placeholder="lam-chu-postgresql"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                maxLength={180}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả lộ trình</Label>
              <Textarea
                placeholder="Tóm tắt nội dung và các bài học trong series..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                className="h-24 resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Hủy
              </Button>
              <Button type="submit" disabled={!title.trim() || !slug.trim() || saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingSeries ? 'Lưu thay đổi' : 'Tạo Series'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSeries} onOpenChange={(open) => !open && setDeletingSeries(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Series này?</AlertDialogTitle>
            <AlertDialogDescription>
              Series sẽ bị xóa. Các bài viết bên trong vẫn được giữ nguyên và không bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingSeries && deleteMutation.mutate(deletingSeries.id)}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xác nhận xóa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
