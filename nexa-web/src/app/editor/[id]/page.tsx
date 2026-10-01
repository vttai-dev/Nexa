'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api/articles';
import { reviewsApi } from '@/lib/api/reviews';
import { toSlug } from '@/lib/utils/slug';
import { ArticleMarkdown } from '@/app/articles/[slug]/ArticleMarkdown';
import { NotebookEditor } from '@/components/articles/NotebookEditor';
import { NexaApiError } from '@/lib/api/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Archive,
  Edit3,
  Save,
  Sparkles,
  Layers,
  History,
  SearchCode,
  SendHorizontal,
  Globe,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useAuthStore } from '@/lib/stores/auth.store';
import { TaxonomyEditorFields } from '@/components/articles/TaxonomyEditorFields';

const articleSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề').max(200, 'Tối đa 200 ký tự'),
  slug: z.string().min(1, 'Slug không được trống').max(180, 'Slug quá dài').regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm a-z, 0-9 và dấu gạch ngang'),
  summary: z.string().max(500, 'Tóm tắt tối đa 500 ký tự'),
  bodyMarkdown: z.string().max(200000, 'Nội dung tối đa 200.000 ký tự'),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).max(10, 'Tối đa 10 tags'),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

function EditArticleContent({ params }: { params: Promise<{ id: string }> }) {
  const queryClient = useQueryClient();
  const { id } = use(params);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'preview' ? 'preview' : 'write';
  const { status } = useAuthStore();
  const [tab, setTab] = useState<'write' | 'preview'>(initialTab);

  // SEO Modal state
  const [seoOpen, setSeoOpen] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  // Review Modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const { data: article, isLoading: loadingArticle, error, refetch } = useQuery({
    queryKey: ['my-article', id],
    queryFn: () => articlesApi.getMine(id),
    enabled: status === 'authenticated',
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: { title: '', slug: '', summary: '', bodyMarkdown: '', tagIds: [] },
  });

  useEffect(() => {
    if (article) {
      reset({
        title: article.title,
        slug: article.slug,
        summary: article.summary || '',
        bodyMarkdown: article.bodyMarkdown || '',
        categoryId: article.categoryId,
        tagIds: [...article.tagIds],
      });
    }
  }, [article, reset]);

  // Load SEO when opened
  const handleOpenSeo = async () => {
    try {
      const seo = await articlesApi.getSeo(id);
      setMetaTitle(seo.metaTitle || '');
      setMetaDescription(seo.metaDescription || '');
      setKeywords(seo.keywords || '');
      setCanonicalUrl(seo.canonicalUrl || '');
    } catch {
      setMetaTitle(article?.title || '');
      setMetaDescription(article?.summary || '');
    }
    setSeoOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: (data: ArticleFormValues) =>
      articlesApi.update(id, {
        version: article!.version,
        article: { ...data, categoryId: data.categoryId || undefined },
      }),
    onSuccess: () => {
      toast({ title: 'Đã lưu thay đổi thành công!' });
      queryClient.invalidateQueries({ queryKey: ['my-article', id] });
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
    },
    onError: (error) =>
      toast({
        title: 'Lỗi lưu thay đổi',
        description:
          error instanceof NexaApiError && error.status === 409
            ? 'Phiên bản bài viết đã thay đổi. Vui lòng tải lại trang.'
            : error instanceof NexaApiError
            ? error.title
            : 'Vui lòng thử lại.',
        variant: 'destructive',
      }),
  });

  const publishMutation = useMutation({
    mutationFn: () => articlesApi.publish(id, article!.version),
    onSuccess: () => {
      toast({
        title: 'Xuất bản bài viết thành công!',
        description: 'Bài viết của bạn đã hiển thị công khai.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-article', id] });
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
    },
    onError: (error) =>
      toast({
        title: 'Không thể xuất bản',
        description: error instanceof NexaApiError ? error.title : 'Vui lòng kiểm tra lại nội dung',
        variant: 'destructive',
      }),
  });

  const archiveMutation = useMutation({
    mutationFn: () => articlesApi.archive(id, article!.version),
    onSuccess: () => {
      toast({
        title: 'Đã lưu trữ bài viết',
        description: 'Bài viết đã được ẩn khỏi danh sách công khai.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-article', id] });
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
    },
    onError: (error) =>
      toast({
        title: 'Không thể lưu trữ',
        description: error instanceof NexaApiError ? error.title : 'Vui lòng thử lại.',
        variant: 'destructive',
      }),
  });

  const saveSeoMutation = useMutation({
    mutationFn: () =>
      articlesApi.updateSeo(id, {
        version: article!.version,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        keywords: keywords || null,
        canonicalUrl: canonicalUrl || null,
      }),
    onSuccess: () => {
      toast({ title: 'Đã lưu cấu hình SEO!' });
      queryClient.invalidateQueries({ queryKey: ['my-article', id] });
      setSeoOpen(false);
    },
    onError: (error) =>
      toast({
        title: 'Lỗi lưu cấu hình SEO',
        description: error instanceof NexaApiError ? error.title : 'Vui lòng thử lại.',
        variant: 'destructive',
      }),
  });

  const submitReviewMutation = useMutation({
    mutationFn: () =>
      reviewsApi.submit(id, {
        version: article!.version,
        note: reviewNote || undefined,
      }),
    onSuccess: () => {
      toast({
        title: 'Đã gửi yêu cầu kiểm duyệt!',
        description: 'Moderator sẽ xem xét bài viết của bạn.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-article', id] });
      setReviewOpen(false);
      setReviewNote('');
    },
    onError: (error) =>
      toast({
        title: 'Không thể gửi kiểm duyệt',
        description: error instanceof NexaApiError ? error.title : 'Vui lòng thử lại.',
        variant: 'destructive',
      }),
  });

  const titleValue = useWatch({ control, name: 'title' });
  const currentCategoryId = useWatch({ control, name: 'categoryId' });
  const currentTagIds = useWatch({ control, name: 'tagIds' }) || [];
  const markdownValue = useWatch({ control, name: 'bodyMarkdown' });

  const generateSlug = () => {
    if (titleValue) {
      setValue('slug', toSlug(titleValue), { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = (data: ArticleFormValues) => updateMutation.mutate(data);

  if (status === 'loading' || loadingArticle) return <PageLoader />;
  if (status === 'unauthenticated') {
    return (
      <EmptyState
        title="Yêu cầu đăng nhập"
        description="Bạn cần đăng nhập để chỉnh sửa bài viết."
        action={
          <Button asChild className="rounded-xl">
            <Link href="/login">Đăng nhập ngay</Link>
          </Button>
        }
      />
    );
  }
  if (error || !article) return <ErrorState retry={() => refetch()} />;

  const isPublished = article.status === 'Published';
  const isArchived = article.status === 'Archived';

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Chỉnh sửa bài viết</h1>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  isPublished
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : isArchived
                    ? 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {isPublished ? 'Đã xuất bản' : isArchived ? 'Đã lưu trữ' : 'Bản nháp'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">ID: {article.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPublished && (
            <Button asChild variant="outline" size="sm" className="rounded-xl border-border/80 text-xs">
              <Link href={`/articles/${article.slug}`} target="_blank">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Xem bài viết
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenSeo}
            className="rounded-xl border-border/80 text-xs"
          >
            <SearchCode className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Cài đặt SEO
          </Button>

          {/* Tab switch */}
          <div className="flex items-center rounded-xl bg-muted p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setTab('write')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                tab === 'write' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                tab === 'preview' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Xem trước
            </button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tiêu đề bài viết
              </Label>
              <Input
                placeholder="VD: Xây dựng ứng dụng Microservices hiệu năng cao với .NET 10"
                {...register('title')}
                className="text-lg font-bold rounded-2xl h-12 border-border/80 focus-visible:ring-primary"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Đường dẫn thân thiện (Slug)
                </Label>
                {!isPublished && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateSlug}
                    className="h-6 text-[11px] text-primary gap-1 font-medium hover:bg-primary/10"
                  >
                    <Sparkles className="w-3 h-3" />
                    Tạo từ tiêu đề
                  </Button>
                )}
              </div>
              <Input
                placeholder="xay-dung-ung-dung-microservices"
                {...register('slug')}
                disabled={isPublished}
                className="font-mono text-xs rounded-xl border-border/80 focus-visible:ring-primary"
              />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mô tả tóm tắt
              </Label>
              <Textarea
                placeholder="Tóm tắt ngắn gọn 1-2 câu về nội dung bài viết..."
                {...register('summary')}
                className="h-20 text-xs rounded-xl resize-none border-border/80 focus-visible:ring-primary"
              />
              {errors.summary && <p className="text-xs text-destructive">{errors.summary.message}</p>}
            </div>

            {/* Notebook Block Editor / Live Preview */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nội dung theo khối
              </Label>

              <div className={tab === 'write' ? '' : 'hidden'}>
                <NotebookEditor
                  value={markdownValue || ''}
                  onChange={(markdown) =>
                    setValue('bodyMarkdown', markdown, { shouldValidate: true, shouldDirty: true })
                  }
                />
              </div>
              {tab === 'preview' && (
                <div className="min-h-[480px] rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
                  {markdownValue ? (
                    <ArticleMarkdown markdown={markdownValue} />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                      Chưa có nội dung.
                    </div>
                  )}
                </div>
              )}
              {errors.bodyMarkdown && (
                <p className="text-xs text-destructive">{errors.bodyMarkdown.message}</p>
              )}
            </div>
          </div>

          {/* Action Column */}
          <div className="space-y-6">
            {/* Taxonomy */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-6">
              <h3 className="font-bold text-xs tracking-tight text-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                Phân loại bài viết
              </h3>

              <TaxonomyEditorFields
                categoryId={currentCategoryId}
                tagIds={currentTagIds}
                onCategoryChange={(value) => setValue('categoryId', value || null, { shouldValidate: true, shouldDirty: true })}
                onTagIdsChange={(value) => setValue('tagIds', value, { shouldValidate: true, shouldDirty: true })}
              />
            </div>

            {/* Publishing Action Box */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-xs tracking-tight text-foreground">Hành động</h3>

              {/* Save changes */}
              <Button
                type="submit"
                className="w-full h-10 rounded-xl font-semibold text-xs border-border/80"
                variant="outline"
                disabled={updateMutation.isPending || archiveMutation.isPending || publishMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu {isPublished ? 'thay đổi' : 'bản nháp'}
              </Button>

              {/* Submit for review */}
              {!isPublished && !isArchived && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setReviewOpen(true)}
                  className="w-full h-10 rounded-xl text-xs font-semibold"
                >
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Gửi kiểm duyệt
                </Button>
              )}

              {/* Publish button */}
              {!isPublished && !isArchived && (
                <Button
                  type="button"
                  onClick={() => publishMutation.mutate()}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Xuất bản ngay
                </Button>
              )}

              {/* Revisions history link */}
              <Button
                asChild
                type="button"
                variant="ghost"
                className="w-full rounded-xl text-xs text-muted-foreground hover:text-foreground justify-start"
              >
                <Link href={`/editor/${id}/revisions`}>
                  <History className="mr-2 h-4 w-4" />
                  Lịch sử chỉnh sửa
                </Link>
              </Button>

              {/* Archive button */}
              {!isArchived && (
                <Button
                  type="button"
                  onClick={() => archiveMutation.mutate()}
                  variant="ghost"
                  className="w-full rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-start"
                  disabled={archiveMutation.isPending}
                >
                  {archiveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  Lưu trữ (Ẩn bài viết)
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* SEO Modal */}
      <Dialog open={seoOpen} onOpenChange={setSeoOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Globe className="w-4 h-4 text-primary" />
              Cấu hình SEO nâng cao
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Meta Title (Tối đa 70 ký tự)</Label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={70}
                placeholder="Tiêu đề hiển thị trên Google..."
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Meta Description (Tối đa 160 ký tự)</Label>
              <Textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={160}
                placeholder="Mô tả hiển thị trên kết quả tìm kiếm..."
                className="h-20 resize-none text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Từ khóa (Keywords, phân cách bởi dấu phẩy)</Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                maxLength={200}
                placeholder="dotnet, microservices, clean-architecture"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Canonical URL (Tùy chọn)</Label>
              <Input
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://..."
                className="text-xs font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSeoOpen(false)} className="text-xs">
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={() => saveSeoMutation.mutate()}
              disabled={saveSeoMutation.isPending}
              className="text-xs"
            >
              {saveSeoMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Lưu cấu hình SEO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Request Modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <SendHorizontal className="w-4 h-4 text-primary" />
              Gửi yêu cầu kiểm duyệt bài viết
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Bài viết sẽ được chuyển vào hàng đợi kiểm duyệt để Moderator xem xét chất lượng trước khi xuất bản.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs">Ghi chú cho Moderator (Tùy chọn)</Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="VD: Bài viết đã bổ sung sơ đồ kiến trúc và ví dụ code hoàn chỉnh..."
                maxLength={2000}
                className="h-24 resize-none text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReviewOpen(false)} className="text-xs">
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={() => submitReviewMutation.mutate()}
              disabled={submitReviewMutation.isPending}
              className="text-xs"
            >
              {submitReviewMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Gửi kiểm duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <EditArticleContent params={params} />
    </Suspense>
  );
}
