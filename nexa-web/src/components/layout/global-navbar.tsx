'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUiStore } from '@/lib/stores/ui.store';
import { useCsrfStore } from '@/lib/stores/csrf.store';
import { authApi } from '@/lib/api/auth';
import { searchApi } from '@/lib/api/search';
import { notificationsApi } from '@/lib/api/notifications';
import { canAuthor, canModerate, isAdmin } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';
import { resolveArticleImageUrl } from '@/lib/media-url';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sparkles,
  Search,
  Bell,
  PenTool,
  Menu,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
  User,
  Hash,
  Clock,
  ArrowRight,
  LayoutDashboard,
  Shield,
  Bookmark,
  LogOut,
  TrendingUp,
  X
} from 'lucide-react';
import { timeAgo } from '@/lib/utils/date';

// Lịch sử & Gợi ý tìm kiếm mặc định mô phỏng
const DEFAULT_RECENT_SEARCHES = [
  'Clean Architecture .NET 10',
  'PostgreSQL indexing & performance',
  'Microservices Event-driven'
];

const POPULAR_TOPICS = [
  { label: 'Clean Architecture', count: '42 bài' },
  { label: '.NET 10', count: '38 bài' },
  { label: 'PostgreSQL', count: '29 bài' },
  { label: 'Docker & K8s', count: '19 bài' },
];

export function GlobalNavbar() {
  const { user, status, clear } = useAuthStore();
  const fetchCsrf = useCsrfStore((s) => s.fetch);
  const { toggleSidebar, toggleSidebarCollapse, sidebarCollapsed } = useUiStore();
  const router = useRouter();

  // Search state
  const [headerSearch, setHeaderSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_RECENT_SEARCHES);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(headerSearch.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [headerSearch]);

  // Click outside to close search popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search suggestions query
  const { data: suggestions, isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedSearch],
    queryFn: () => searchApi.getSuggestions(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  // Notifications query
  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
    enabled: status === 'authenticated',
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-tray'],
    queryFn: () => notificationsApi.list({ page: 1, pageSize: 5 }),
    enabled: status === 'authenticated' && notifOpen,
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

  const handleExecuteSearch = (query: string) => {
    if (!query.trim()) return;
    const trimmed = query.trim();
    if (!recentSearches.includes(trimmed)) {
      setRecentSearches([trimmed, ...recentSearches.slice(0, 4)]);
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setHeaderSearch('');
    setIsSearchFocused(false);
  };

  const initials = user?.profile.displayName
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] dark:border-white/[0.06] bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-colors">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        
        {/* Left: Hamburger (Mobile) + Sidebar Toggle (Desktop) + Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile drawer trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden text-muted-foreground hover:text-foreground"
            title="Mở menu điều hướng"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapse}
            className="hidden md:flex text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl h-9 w-9"
            title={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4 text-cyan-400" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          {/* Brand Logo with Multi-color Glow Effect */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white transition-all duration-300">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                Nexa
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Dynamic Quick Search Bar with Autocomplete Popover */}
        <div ref={searchContainerRef} className="relative hidden md:block w-72 lg:w-96">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteSearch(headerSearch);
            }}
          >
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, tác giả, tags..."
              value={headerSearch}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs rounded-full border border-white/10 bg-card/40 dark:bg-card/30 backdrop-blur-md focus:bg-background/90 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground shadow-inner"
            />
            {headerSearch && (
              <button
                type="button"
                onClick={() => setHeaderSearch('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown Panel (Glassmorphism) */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card/90 dark:bg-[#0D121F]/90 backdrop-blur-2xl rounded-2xl border border-white/10 dark:border-white/[0.08] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)] overflow-hidden z-50 divide-y divide-white/5 animate-in fade-in-0 zoom-in-95 duration-200">
              
              {/* If user typed >= 2 characters: show live API suggestions */}
              {debouncedSearch.length >= 2 ? (
                <div>
                  <div className="px-3.5 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Kết quả gợi ý trực tiếp</span>
                    {isSuggestionsLoading && <span className="text-[10px] text-cyan-400 animate-pulse">Đang tải...</span>}
                  </div>
                  {suggestions && suggestions.items.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                      {suggestions.items.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={() => {
                            setIsSearchFocused(false);
                            router.push(item.url || `/search?q=${encodeURIComponent(item.value)}`);
                          }}
                          className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-xs group"
                        >
                          {item.type === 'article' && (
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {item.type === 'user' && (
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {item.type === 'tag' && (
                            <div className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                              <Hash className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className="truncate text-foreground/90 font-medium group-hover:text-cyan-400 transition-colors">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                      Không tìm thấy từ khóa khớp với &ldquo;{debouncedSearch}&rdquo;
                    </div>
                  )}
                </div>
              ) : (
                /* Default Panel: Recent Searches + Popular Topics */
                <div className="p-3 space-y-3">
                  {recentSearches.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          Tìm kiếm gần đây
                        </span>
                        <button
                          type="button"
                          onMouseDown={() => setRecentSearches([])}
                          className="hover:text-foreground text-[10px]"
                        >
                          Xóa
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={() => handleExecuteSearch(term)}
                            className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 hover:text-cyan-400 text-muted-foreground transition-colors border border-white/5"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-purple-400" />
                      Chủ đề xu hướng
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {POPULAR_TOPICS.map((topic, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={() => handleExecuteSearch(topic.label)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-purple-500/10 hover:text-purple-300 text-muted-foreground transition-colors border border-white/5 text-left"
                        >
                          <span className="truncate">#{topic.label}</span>
                          <span className="text-[10px] font-mono text-muted-foreground/60">{topic.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* View All Footer */}
              <div className="p-2 bg-white/[0.02]">
                <button
                  type="button"
                  onMouseDown={() => handleExecuteSearch(headerSearch || 'tri-thuc')}
                  className="w-full text-center text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold py-1 flex items-center justify-center gap-1 group"
                >
                  Xem toàn bộ kết quả tìm kiếm
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Notifications, Write CTA (Neon Purple), Theme Toggle, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <ThemeToggle />

          {/* Write Article CTA (Neon-purple gradient) */}
          <Button
            asChild
            size="sm"
            className="hidden sm:inline-flex rounded-full px-4 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold border-none transition-all duration-300 text-xs"
          >
            <Link href={user && canAuthor(user.account.roles) ? '/editor/new' : '/author-registration'}>
              <PenTool className="h-3.5 w-3.5 mr-1.5 text-primary-foreground" />
              {user && canAuthor(user.account.roles) ? 'Viết bài' : 'Đăng ký tác giả'}
            </Link>
          </Button>

          {/* Notification Tray with Neon dot badge */}
          {status === 'authenticated' && user && (
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full h-9 w-9 hover:bg-white/5 text-foreground/80 hover:text-foreground transition-colors"
                    title="Thông báo hệ thống"
                  />
                }
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadData && unreadData.count > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                )}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl border-white/10 dark:border-white/[0.08] bg-card/95 dark:bg-[#0D121F]/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-3.5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-sm">Thông báo</span>
                    {unreadData && unreadData.count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                        {unreadData.count} mới
                      </span>
                    )}
                  </div>
                  <Link
                    href="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Xem tất cả
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {notificationsData?.items && notificationsData.items.length > 0 ? (
                    notificationsData.items.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setNotifOpen(false);
                          if (notif.articleSlug) router.push(`/articles/${notif.articleSlug}`);
                        }}
                        className={`p-3.5 hover:bg-white/5 transition-colors cursor-pointer text-xs space-y-1 ${
                          !notif.isRead ? 'bg-primary/5' : ''
                        }`}
                      >
                        <p className="text-foreground/90 font-medium leading-snug">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{timeAgo(notif.createdAtUtc)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Không có thông báo mới nào
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* User Profile Avatar Dropdown */}
          {status === 'loading' ? (
            <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
          ) : status === 'authenticated' && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative rounded-full ring-2 ring-transparent hover:ring-purple-500/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all p-0.5 cursor-pointer">
                <Avatar className="h-8 w-8 ring-1 ring-white/10">
                  <AvatarImage src={resolveArticleImageUrl(user.profile.avatarUrl ?? undefined)} />
                  <AvatarFallback className="bg-muted text-foreground font-bold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-2xl rounded-2xl border-white/10 dark:border-white/[0.08] bg-card/95 dark:bg-[#0D121F]/95 backdrop-blur-2xl">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <div className="font-semibold text-foreground text-sm truncate">{user.profile.displayName}</div>
                  <div className="text-[11px] text-primary font-mono mt-0.5">@{user.account.userName}</div>
                </div>

                {canAuthor(user.account.roles) && (
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer rounded-xl flex items-center gap-2.5 text-xs py-2">
                    <LayoutDashboard className="h-4 w-4 text-purple-400" />
                    <span>Dashboard tác giả</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => router.push(`/u/${user.account.userName}`)} className="cursor-pointer rounded-xl flex items-center gap-2.5 text-xs py-2">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span>Trang cá nhân</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push('/dashboard/bookmarks')} className="cursor-pointer rounded-xl flex items-center gap-2.5 text-xs py-2">
                  <Bookmark className="h-4 w-4 text-amber-400" />
                  <span>Bài viết đã lưu</span>
                </DropdownMenuItem>

                {canModerate(user.account.roles) && (
                  <>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={() => router.push(isAdmin(user.account.roles) ? '/admin' : '/admin/article-reviews')} className="cursor-pointer rounded-xl flex items-center gap-2.5 text-xs py-2 text-purple-400 font-medium">
                      <Shield className="h-4 w-4" />
                      <span>{isAdmin(user.account.roles) ? 'Khu vực Quản trị' : 'Kiểm duyệt bài viết'}</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer rounded-xl flex items-center gap-2.5 text-xs py-2">
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="rounded-full text-xs hover:bg-white/5">
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                <Link href="/register">Tham gia</Link>
              </Button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
