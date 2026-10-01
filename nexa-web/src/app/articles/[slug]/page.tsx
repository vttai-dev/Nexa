import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articlesApi } from '@/lib/api/articles';
import { taxonomyApi } from '@/lib/api/taxonomy';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate, timeAgo } from '@/lib/utils/date';
import { Calendar, Clock, ChevronRight, Sparkles, BookOpen, Eye, MessageCircle, Share2 } from 'lucide-react';
import { ArticleActions } from './ArticleActions';
import { ArticleViewTracker } from './ArticleViewTracker';
import { CommentsSection } from './CommentsSection';
import { ArticleMarkdown } from './ArticleMarkdown';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { NexaApiError } from '@/lib/api/client';
import type { ArticleDto, ArticleSummaryDto } from '@/lib/types/api';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const article = await articlesApi.getBySlug(slug);
    return {
      title: `${article.title} — Nexa`,
      description: article.summary,
    };
  } catch {
    return { title: 'Bài viết — Nexa' };
  }
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;

  let article: ArticleDto;
  let metadata;
  try {
    article = await articlesApi.getBySlug(slug);
    try {
      metadata = await articlesApi.getMetadata(slug);
    } catch { /* ok */ }
  } catch (e) {
    if (e instanceof NexaApiError && e.status === 404) notFound();
    notFound();
  }

  // Fetch tags for this article
  let allTags: { id: string; name: string; slug: string }[] = [];
  try {
    const tagsResult = await taxonomyApi.listTags({ pageSize: 100 });
    allTags = tagsResult.items;
  } catch { /* ok */ }

  const articleTags = allTags.filter((t) => article.tagIds.includes(t.id));
  
  let relatedArticles: ArticleSummaryDto[] = [];
  try {
    const rel = await articlesApi.getRelated(slug);
    relatedArticles = rel.items;
  } catch { /* ok */ }

  const initials = article.authorName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-10">
      <ArticleViewTracker slug={slug} />
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Link href="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
        <Link href="/articles" className="hover:text-foreground transition-colors">Bài viết</Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span className="text-foreground truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
      </nav>

      {/* Article Header */}
      <header className="space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            Kiến thức chuyên sâu
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.2]">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-normal">
              {article.summary}
            </p>
          )}
        </div>

        {/* Author & Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60">
          <Link 
            href={`/u/${article.authorName}`}
            className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
          >
            <Avatar className="h-11 w-11 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-violet-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">
                {article.authorName}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {article.publishedAtUtc && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.publishedAtUtc)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(article.publishedAtUtc)}
                </span>
                {metadata && <><span>•</span><span>{metadata.readingTimeMinutes} phút đọc</span></>}
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{(metadata?.viewCount ?? article.viewCount).toLocaleString('vi-VN')} lượt xem</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{(metadata?.commentCount ?? article.commentCount).toLocaleString('vi-VN')} bình luận</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Share2 className="h-3 w-3" />{(metadata?.shareCount ?? article.shareCount).toLocaleString('vi-VN')} chia sẻ</span>
              </div>
            </div>
          </Link>

          {/* Action Bar (Like, Bookmark) */}
          <Suspense fallback={<div className="h-9 w-32 bg-muted/40 animate-pulse rounded-lg" />}>
            <ArticleActions article={article} />
          </Suspense>
        </div>

        {/* Tags cloud */}
        {articleTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {articleTags.map((tag) => (
              <Link 
                key={tag.id} 
                href={`/articles?tagId=${tag.id}`}
                className="text-xs font-mono px-3 py-1 rounded-md bg-secondary/80 text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Article Body */}
      <main>
        <ArticleMarkdown markdown={article.bodyMarkdown} />
      </main>

      {/* Author Callout Card */}
      <section className="rounded-2xl border border-border/80 bg-gradient-to-br from-muted/50 to-muted/20 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <Avatar className="h-16 w-16 ring-4 ring-background shrink-0">
          <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg text-foreground">{article.authorName}</h3>
              <p className="text-xs text-muted-foreground font-mono">Tác giả bài viết</p>
            </div>
            <Link
              href={`/u/${article.authorName}`}
              className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-foreground transition-all"
            >
              Xem trang cá nhân
            </Link>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-border/70">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Bài viết liên quan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedArticles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section className="pt-6 border-t border-border/70">
        <Suspense fallback={<div className="h-32 rounded-2xl bg-muted/40 animate-pulse" />}>
          <CommentsSection articleId={article.id} />
        </Suspense>
      </section>

    </div>
  );
}
