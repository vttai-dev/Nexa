import type { Metadata } from 'next';
import { accountApi } from '@/lib/api/account';
import { articlesApi } from '@/lib/api/articles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { LinkIcon, BookOpen, Sparkles } from 'lucide-react';
import { FollowUserButton } from './FollowUserButton';
import { ReportUserButton } from './ReportUserButton';

import { notFound } from 'next/navigation';
import type { PublicProfileDto, ArticleSummaryDto } from '@/lib/types/api';
import { resolveArticleImageUrl } from '@/lib/media-url';

interface Props {
  params: Promise<{ userName: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userName } = await params;
  try {
    const profile = await accountApi.getPublicProfile(userName);
    return { 
      title: `${profile.displayName} (@${profile.userName}) — Nexa`,
      description: profile.bio || `Hồ sơ tác giả ${profile.displayName} trên nền tảng kỹ thuật Nexa.`,
    };
  } catch {
    return { title: `@${userName} — Nexa` };
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { userName } = await params;
  let profile: PublicProfileDto;
  let articles: ArticleSummaryDto[] = [];

  try {
    profile = await accountApi.getPublicProfile(userName);
    const articlesRes = await articlesApi.list({ authorId: profile.userId, pageSize: 18 });
    articles = articlesRes.items;
  } catch {
    notFound();
  }

  const initials = profile.displayName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-12">
      
      {/* Profile Hero Card */}
      <div className="relative rounded-3xl border border-border/80 bg-card p-6 pt-20 sm:p-10 sm:pt-24 shadow-xs overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 z-0 h-40 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 bg-cover bg-center"
          style={profile.coverImageUrl ? { backgroundImage: `linear-gradient(to bottom, rgb(15 23 42 / 20%), rgb(15 23 42 / 72%)), url("${resolveArticleImageUrl(profile.coverImageUrl)}")` } : undefined}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
          
          {/* Avatar with Glow Ring */}
          <div className="relative">
            <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-primary/20 shadow-lg">
              <AvatarImage src={resolveArticleImageUrl(profile.avatarUrl ?? undefined)} />
              <AvatarFallback className="bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {profile.displayName}
                  </h1>
                  <span className="inline-flex items-center text-xs font-mono px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    @{profile.userName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FollowUserButton userId={profile.userId} userName={profile.userName} />
                  <ReportUserButton userId={profile.userId} userName={profile.userName} />
                </div>
              </div>
            </div>
            
            {/* Bio */}
            {profile.bio ? (
              <p className="text-sm sm:text-base text-foreground/90 max-w-2xl leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Tác giả chưa cập nhật phần giới thiệu bản thân.
              </p>
            )}
            
            {/* Meta Row (Website & Count) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{articles.length} bài viết đã xuất bản</span>
              </div>

              {profile.websiteUrl && (
                <div className="flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-primary" />
                  <a 
                    href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline font-mono"
                  >
                    {profile.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {profile.company && <span className="rounded-full bg-muted px-3 py-1">{profile.company}</span>}
              {profile.gitHubUrl && <a href={profile.gitHubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a>}
              {profile.linkedInUrl && <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a>}
            </div>
            {profile.skills.length > 0 && <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">{profile.skills.map((skill) => <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{skill}</span>)}</div>}
          </div>

        </div>
      </div>

      {/* Published Articles Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Bài viết của {profile.displayName}
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {articles.length} bài
          </span>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm text-muted-foreground">
              Tác giả hiện chưa có bài viết xuất bản nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
