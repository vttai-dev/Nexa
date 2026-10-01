import { notFound } from 'next/navigation';
import { seriesApi } from '@/lib/api/series';
import { NexaApiError } from '@/lib/api/client';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { Library, BookOpen, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params;

  let series;
  try {
    series = await seriesApi.getBySlug(slug);
  } catch (e) {
    if (e instanceof NexaApiError && e.status === 404) notFound();
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-10">
      {/* Top Breadcrumb */}
      <div>
        <Button asChild variant="ghost" size="sm" className="rounded-xl gap-2 text-muted-foreground">
          <Link href="/articles">
            <ArrowLeft className="w-4 h-4" />
            Quay lại Khám phá
          </Link>
        </Button>
      </div>

      {/* Series Hero Banner */}
      <div className="relative rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xs overflow-hidden space-y-4">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500" />
        
        <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
          <Library className="w-4 h-4" />
          Series bài viết
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {series.title}
        </h1>

        {series.description && (
          <p className="text-base text-muted-foreground max-w-3xl leading-relaxed whitespace-pre-wrap">
            {series.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t text-xs text-muted-foreground">
          <Link 
            href={`/u/${series.authorName}`} 
            className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
          >
            <User className="w-4 h-4 text-primary" />
            <span>Tác giả: {series.authorName}</span>
          </Link>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{series.articles?.length || 0} bài viết trong lộ trình</span>
          </span>
        </div>
      </div>

      {/* Articles in Series */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Các bài viết trong Series
        </h2>

        {series.articles?.length ? (
          <div className="space-y-4">
            {series.articles.map((article, index) => (
              <div key={article.id} className="relative flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 mt-3 ring-2 ring-background">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <ArticleCard article={article} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed text-muted-foreground text-sm">
            Chưa có bài viết nào được xuất bản trong series này.
          </div>
        )}
      </div>
    </div>
  );
}
