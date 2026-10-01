import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ArticleSummaryDto } from '@/lib/types/api';
import { timeAgo } from '@/lib/utils/date';
import { ArrowUpRight, Clock, Eye, MessageCircle, Share2, Sparkles } from 'lucide-react';

interface Props {
  article: ArticleSummaryDto;
  showStatus?: boolean;
}

export function ArticleCard({ article, showStatus }: Props) {
  const initials = article.authorName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isDraft = article.status === 'Draft';
  const isArchived = article.status === 'Archived';
  const targetUrl = isDraft 
    ? `/editor/${article.id}?tab=preview` 
    : isArchived 
    ? `/editor/${article.id}` 
    : `/articles/${article.slug}`;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-indigo-500/5">
      {/* Top Meta */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-primary/90 bg-primary/10 px-2 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" />
              Kỹ thuật
            </span>
            {showStatus && <StatusBadge status={article.status} />}
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-muted-foreground/70" />
            {article.publishedAtUtc ? timeAgo(article.publishedAtUtc) : 'Chưa xuất bản'}
          </span>
        </div>

        {/* Title */}
        <Link href={targetUrl} className="block group/link">
          <h3 className="font-bold text-lg leading-snug tracking-tight text-foreground transition-colors group-hover/link:text-primary line-clamp-2">
            {article.title}
          </h3>
        </Link>

        {/* Summary */}
        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {article.summary || "Bấm vào để xem nội dung bài viết này..."}
        </p>
        {!isDraft && !isArchived && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground" aria-label="Thống kê bài viết">
            <span className="inline-flex items-center gap-1.5" title="Lượt xem"><Eye className="h-3.5 w-3.5" />{(article.viewCount ?? 0).toLocaleString('vi-VN')}</span>
            <span className="inline-flex items-center gap-1.5" title="Bình luận"><MessageCircle className="h-3.5 w-3.5" />{(article.commentCount ?? 0).toLocaleString('vi-VN')}</span>
            <span className="inline-flex items-center gap-1.5" title="Lượt chia sẻ"><Share2 className="h-3.5 w-3.5" />{(article.shareCount ?? 0).toLocaleString('vi-VN')}</span>
          </div>
        )}
      </div>

      {/* Footer / Author */}
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
        <Link 
          href={`/u/${article.authorName}`}
          className="flex items-center gap-2.5 group/author hover:opacity-85 transition-opacity"
        >
          <Avatar className="h-7 w-7 ring-1 ring-border/80">
            <AvatarFallback className="bg-muted text-foreground font-semibold text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground group-hover/author:text-primary transition-colors">
            {article.authorName}
          </span>
        </Link>

        {isDraft ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/editor/${article.id}?tab=preview`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
            >
              Xem trước
              <ArrowUpRight className="w-3 h-3" />
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link
              href={`/editor/${article.id}`}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Chỉnh sửa
            </Link>
          </div>
        ) : isArchived ? (
          <Link
            href={`/editor/${article.id}`}
            className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
          >
            Quản lý
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            href={`/articles/${article.slug}`}
            className="text-xs font-medium text-muted-foreground group-hover:text-primary flex items-center gap-0.5 transition-colors"
          >
            Đọc tiếp
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: ArticleSummaryDto['status'] }) {
  const styles = {
    Draft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Published: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Archived: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  } as const;

  const labels = { Draft: 'Bản nháp', Published: 'Đã xuất bản', Archived: 'Lưu trữ' };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export { StatusBadge as ArticleStatusBadge };
