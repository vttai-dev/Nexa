'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '@/lib/api/articles';
import { toSlug } from '@/lib/utils/slug';
import { ArticleMarkdown } from '@/app/articles/[slug]/ArticleMarkdown';
import { NotebookEditor } from '@/components/articles/NotebookEditor';
import { NexaApiError } from '@/lib/api/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  ArrowLeft,
  Eye,
  Edit3,
  Save,
  Sparkles,
  Layers,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/states';
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

export default function NewArticlePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status } = useAuthStore();
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      slug: '',
      summary: '',
      bodyMarkdown: '',
      categoryId: '',
      tagIds: [],
    },
  });

  const titleValue = useWatch({ control, name: 'title' });
  const currentCategoryId = useWatch({ control, name: 'categoryId' });
  const currentTagIds = useWatch({ control, name: 'tagIds' }) || [];
  const markdownValue = useWatch({ control, name: 'bodyMarkdown' });

  const createMutation = useMutation({
    mutationFn: (data: ArticleFormValues) =>
      articlesApi.create({
        ...data,
        categoryId: data.categoryId || undefined,
      }),
    onSuccess: (res) => {
      toast({ title: 'Đã tạo bản nháp thành công!' });
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      router.push(`/editor/${res.id}`);
    },
    onError: (error) =>
      toast({
        title: 'Không thể tạo bài viết',
        description: error instanceof NexaApiError ? error.title : 'Vui lòng kiểm tra lại thông tin.',
        variant: 'destructive',
      }),
  });

  const generateSlug = () => {
    if (titleValue) {
      setValue('slug', toSlug(titleValue), { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = (data: ArticleFormValues) => {
    createMutation.mutate(data);
  };

  if (status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated') {
    return (
      <EmptyState
        title="Yêu cầu đăng nhập"
        description="Bạn cần đăng nhập để viết bài mới."
        action={
          <Button asChild className="rounded-xl">
            <Link href="/login">Đăng nhập ngay</Link>
          </Button>
        }
      />
    );
  }

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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Viết bài mới</h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                Bản nháp mới
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Soạn thảo nội dung theo từng khối sổ tay (.ipynb)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                onBlur={() => {
                  if (titleValue) {
                    setValue('slug', toSlug(titleValue), { shouldValidate: true });
                  }
                }}
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
              </div>
              <Input
                placeholder="xay-dung-ung-dung-microservices"
                {...register('slug')}
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

              <Button
                type="submit"
                className="w-full h-10 rounded-xl font-semibold text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu bản nháp & Tiếp tục
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
