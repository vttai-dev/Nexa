'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '@/lib/api/media';
import { useAuthStore } from '@/lib/stores/auth.store';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/hooks/use-toast';
import { canAuthor } from '@/lib/types/api';
import { 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  FileIcon, 
  Image as ImageIcon, 
  ArrowLeft, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MediaLibraryPage() {
  const { user, status } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-media', page],
    queryFn: () => mediaApi.listMine({ page, pageSize: 20 }),
    enabled: status === 'authenticated',
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const isImage = file.type.startsWith('image/');
      return isImage ? mediaApi.uploadImage(file) : mediaApi.uploadFile(file);
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ['my-media'] });
      toast({ title: 'Tải lên thành công', description: asset.fileName });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (e: any) => {
      toast({ title: 'Tải lên thất bại', description: e.title || 'Vui lòng kiểm tra dung lượng tệp', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.deleteMedia(id),
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['my-media'] });
      toast({ title: 'Đã xóa tệp media' });
    },
    onError: (e: any) => {
      setDeletingId(null);
      toast({ title: 'Lỗi khi xóa', description: e.title, variant: 'destructive' });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const copyUrl = (id: string, url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'https://localhost:7210'}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast({ title: 'Đã sao chép URL', description: fullUrl });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated') {
    return <EmptyState title="Yêu cầu đăng nhập" description="Vui lòng đăng nhập để xem thư viện media." />;
  }
  if (user && !canAuthor(user.account.roles)) {
    return <EmptyState title="Đăng ký quyền tác giả" description="Thư viện tải ảnh và tài liệu chỉ dành cho tác giả." action={<Button asChild><Link href="/author-registration">Đăng ký làm tác giả</Link></Button>} />;
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
            <h1 className="text-2xl font-bold tracking-tight">Thư viện Media & Tệp tin</h1>
            <p className="text-xs text-muted-foreground">Tải lên hình ảnh và tài liệu đính kèm cho bài viết của bạn</p>
          </div>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.docx,.txt"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="rounded-xl gap-2 font-medium"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Tải tệp lên
          </Button>
        </div>
      </div>

      {/* Media Grid */}
      {data?.items.length ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.items.map((asset) => {
              const isImage = asset.contentType.startsWith('image/');
              const assetUrl = asset.url.startsWith('http') 
                ? asset.url 
                : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'https://localhost:7210'}${asset.url}`;

              return (
                <div 
                  key={asset.id} 
                  className="group relative rounded-2xl border border-border/70 bg-card/60 p-3 space-y-2 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video rounded-xl bg-muted/50 overflow-hidden flex items-center justify-center">
                    {isImage ? (
                      <img 
                        src={assetUrl} 
                        alt={asset.fileName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    ) : (
                      <FileIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate" title={asset.fileName}>
                      {asset.fileName}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {(asset.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyUrl(asset.id, asset.url)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Sao chép URL"
                    >
                      {copiedId === asset.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>

                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Mở liên kết"
                    >
                      <a href={assetUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(asset.id)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Xóa tệp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
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
          title="Chưa có tệp tải lên"
          description="Tải lên ảnh hoặc tài liệu để chèn vào bài viết của bạn."
          action={
            <Button onClick={() => fileInputRef.current?.click()} className="rounded-xl">
              <Upload className="w-4 h-4 mr-2" />
              Tải ảnh đầu tiên
            </Button>
          }
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tệp media này?</AlertDialogTitle>
            <AlertDialogDescription>
              Tệp sẽ bị xóa vĩnh viễn khỏi máy chủ. Bất kỳ bài viết nào đang nhúng ảnh này sẽ không hiển thị được nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
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
