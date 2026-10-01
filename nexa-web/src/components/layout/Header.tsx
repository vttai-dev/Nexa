'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useCsrfStore } from '@/lib/stores/csrf.store';
import { authApi } from '@/lib/api/auth';
import { searchApi } from '@/lib/api/search';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PenTool, LogOut, User, LayoutDashboard, Shield, Sparkles, Bell, Bookmark, Hash, Search, BookOpen, Loader2 } from 'lucide-react';
import { canAuthor, canModerate, isAdmin } from '@/lib/types/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { resolveArticleImageUrl } from '@/lib/media-url';

function NotificationRealtimeBridge({ active }: { active: boolean }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!active) return;
    const stream = new EventSource(notificationsApi.streamUrl, { withCredentials: true });
    const refreshNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    };
    stream.addEventListener('notification', refreshNotifications);
    return () => stream.close();
  }, [active, queryClient]);

  return null;
}

function NotificationBadge() {
  const { data } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 60000,
  });

  if (!data || data.count === 0) return null;

  return (
    <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
      {data.count > 9 ? '9+' : data.count}
    </span>
  );
}

export function Header() {
  const { user, status, clear } = useAuthStore();
  const fetchCsrf = useCsrfStore((s) => s.fetch);
  const router = useRouter();
  const pathname = usePathname();
  const [headerSearch, setHeaderSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(headerSearch.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [headerSearch]);

  const { data: suggestions, isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedSearch],
    queryFn: () => searchApi.getSuggestions(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
      await fetchCsrf();
      router.push('/');
    }
  };

  const initials = user?.profile.displayName
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  const navLinks = [
    { label: 'Khám phá', href: '/' },
    { label: 'Bài viết', href: '/articles' },
    { label: 'Tác giả', href: '/contributors' },
    { label: 'Tìm kiếm', href: '/search' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <NotificationRealtimeBridge active={status === 'authenticated'} />
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 text-white shadow-md shadow-purple-500/25 group-hover:scale-105 group-hover:shadow-cyan-400/40 transition-all duration-200">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
                Nexa
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 pl-2">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-accent/80 text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Quick Search Bar */}
          <div ref={searchContainerRef} className="relative hidden md:block w-48 lg:w-64">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (headerSearch.trim()) {
                  router.push(`/search?q=${encodeURIComponent(headerSearch.trim())}`);
                  setHeaderSearch('');
                  setIsSearchFocused(false);
                }
              }}
            >
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={headerSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Delay blur so click on suggestion item registers
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border/60 bg-muted/30 focus:bg-background/80 focus:outline-none focus:ring-1 focus:ring-purple-500/80 focus:border-cyan-500/50 transition-all placeholder:text-muted-foreground"
              />
            </form>

            {/* Suggestions Popover */}
            {isSearchFocused && debouncedSearch.length >= 2 && suggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-card/95 backdrop-blur-md rounded-xl border border-border/80 shadow-2xl overflow-hidden z-50 py-1 divide-y divide-border/40">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Gợi ý tìm kiếm</span>
                  {isSuggestionsLoading && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                </div>
                {suggestions.items.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto divide-y divide-border/30">
                    {suggestions.items.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => {
                          setHeaderSearch('');
                          setIsSearchFocused(false);
                          router.push(item.url || `/search?q=${encodeURIComponent(item.value)}`);
                        }}
                        className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-muted/80 transition-colors text-xs group"
                      >
                        {item.type === 'article' && (
                          <div className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <BookOpen className="w-3 h-3" />
                          </div>
                        )}
                        {item.type === 'user' && (
                          <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <User className="w-3 h-3" />
                          </div>
                        )}
                        {item.type === 'tag' && (
                          <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Hash className="w-3 h-3" />
                          </div>
                        )}
                        <span className="truncate text-foreground/90 font-medium group-hover:text-primary transition-colors">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                    Không tìm thấy gợi ý
                  </div>
                )}
                <div className="p-1.5 bg-muted/30">
                  <button
                    type="button"
                    onMouseDown={() => {
                      router.push(`/search?q=${encodeURIComponent(headerSearch.trim())}`);
                      setHeaderSearch('');
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-center text-[11px] text-primary hover:underline font-medium py-1"
                  >
                    Xem tất cả kết quả cho &ldquo;{headerSearch}&rdquo; &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {status === 'loading' ? (
            <div className="h-8 w-20 rounded-lg bg-muted/60 animate-pulse" />
          ) : status === 'authenticated' && user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 hover:shadow-purple-500/50 font-medium rounded-xl transition-all duration-200">
                <Link href={canAuthor(user.account.roles) ? '/editor/new' : '/author-registration'}>
                  <PenTool className="h-3.5 w-3.5 mr-1.5" />
                  {canAuthor(user.account.roles) ? 'Viết bài' : 'Đăng ký tác giả'}
                </Link>
              </Button>

              <Button asChild variant="ghost" size="icon" className="relative rounded-full hover:bg-muted/60 transition-colors">
                <Link href="/notifications">
                  <Bell className="h-5 w-5 text-foreground/80" />
                  <NotificationBadge />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger className="relative rounded-full ring-2 ring-transparent hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary transition-all p-0.5 cursor-pointer">
                  <Avatar className="h-8 w-8 ring-1 ring-border">
                    <AvatarImage src={resolveArticleImageUrl(user.profile.avatarUrl ?? undefined)} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl border-border/80">
                  <div className="px-2.5 py-2">
                    <div className="font-semibold text-foreground text-sm">{user.profile.displayName}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">@{user.account.userName}</div>
                  </div>
                  <DropdownMenuSeparator />
                  {canAuthor(user.account.roles) && (
                    <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer rounded-md flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      <span>Dashboard bài viết</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => router.push(`/u/${user.account.userName}`)} className="cursor-pointer rounded-md flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Trang cá nhân</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/bookmarks')} className="cursor-pointer rounded-md flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                    <span>Bài viết đã lưu</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/following-tags')} className="cursor-pointer rounded-md flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span>Thẻ đang theo dõi</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="cursor-pointer rounded-md flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Chỉnh sửa hồ sơ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(canAuthor(user.account.roles) ? '/editor/new' : '/author-registration')} className="cursor-pointer rounded-md sm:hidden flex items-center gap-2 text-primary font-medium">
                    <PenTool className="h-4 w-4" />
                    <span>{canAuthor(user.account.roles) ? 'Soạn bài mới' : 'Đăng ký làm tác giả'}</span>
                  </DropdownMenuItem>
                  {canModerate(user.account.roles) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push(isAdmin(user.account.roles) ? '/admin' : '/admin/article-reviews')} className="cursor-pointer rounded-md flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                        <Shield className="h-4 w-4" />
                        <span>{isAdmin(user.account.roles) ? 'Khu vực Quản trị' : 'Trung tâm Kiểm duyệt'}</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer rounded-md flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-xs shadow-primary/20">
                <Link href="/register">Tham gia</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
