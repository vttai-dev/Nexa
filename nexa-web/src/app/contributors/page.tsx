'use client';

import { useQuery } from '@tanstack/react-query';
import { accountApi } from '@/lib/api/account';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowUserButton } from '@/app/u/[userName]/FollowUserButton';
import { Trophy, Award, Heart, MessageSquare, BookOpen, Star } from 'lucide-react';
import Link from 'next/link';
import { resolveArticleImageUrl } from '@/lib/media-url';

export default function TopContributorsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['top-contributors'],
    queryFn: () => accountApi.getTopContributors(50),
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState retry={() => refetch()} />;

  const getRankBadge = (index: number) => {
    if (index === 0) return <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-sm flex items-center justify-center ring-2 ring-amber-500/30">🥇</div>;
    if (index === 1) return <div className="w-7 h-7 rounded-full bg-slate-400/20 text-slate-600 dark:text-slate-300 font-extrabold text-sm flex items-center justify-center ring-2 ring-slate-400/30">🥈</div>;
    if (index === 2) return <div className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-500 font-extrabold text-sm flex items-center justify-center ring-2 ring-amber-700/30">🥉</div>;
    return <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground font-mono font-bold text-xs flex items-center justify-center">{index + 1}</div>;
  };

  const getLevelBadge = (level: string) => {
    if (level === 'Expert') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Chuyên gia
        </span>
      );
    }
    if (level === 'Contributor') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
          <Award className="w-3 h-3" />
          Cống hiến
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border">
        Thành viên mới
      </span>
    );
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      {/* Top Header */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-indigo-900/10 via-card to-card p-6 sm:p-10 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-amber-500" />
          Bảng xếp hạng cộng đồng
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Top Kỹ sư & Tác giả đóng góp
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          Vinh danh các tác giả có nhiều bài viết chất lượng cao và tích cực chia sẻ kiến thức nhất trên Nexa.
        </p>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="space-y-3">
        {data?.map((author, index) => {
          const initials = author.displayName?.[0]?.toUpperCase() ?? '?';

          return (
            <div
              key={author.userId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 transition-all shadow-xs"
            >
              {/* Left Info */}
              <div className="flex items-center gap-4">
                <div className="shrink-0 flex items-center justify-center">
                  {getRankBadge(index)}
                </div>

                <Avatar className="h-12 w-12 ring-2 ring-primary/20 shrink-0">
                  <AvatarImage src={resolveArticleImageUrl(author.avatarUrl ?? undefined)} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/u/${author.userName}`}
                      className="font-bold text-base text-foreground hover:text-primary transition-colors"
                    >
                      {author.displayName}
                    </Link>
                    <span className="text-xs text-muted-foreground font-mono">
                      @{author.userName}
                    </span>
                    {getLevelBadge(author.level)}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      {author.publishedArticles} bài viết
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      {author.likesReceived} thích
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                      {author.commentsReceived} thảo luận
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Stats & Follow */}
              <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground font-medium">Điểm cống hiến</div>
                  <div className="text-lg font-extrabold text-primary font-mono">
                    {author.contributionScore}
                  </div>
                </div>

                <FollowUserButton userId={author.userId} userName={author.userName} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
