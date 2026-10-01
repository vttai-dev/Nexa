'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUiStore } from '@/lib/stores/ui.store';
import { canAuthor, canModerate, isAdmin } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import {
  Compass,
  BookOpen,
  Users,
  Search,
  Sparkles,
  LayoutDashboard,
  PenTool,
  Library,
  ImageIcon,
  Bookmark,
  Hash,
  Shield,
  FileCheck2,
  FolderTree,
  Tags,
  Flag,
  ScrollText,
  ChevronDown,
  Layers,
  Zap,
  Flame,
  Star,
  Settings,
  X
} from 'lucide-react';

interface SubNavItem {
  title: string;
  href: string;
  badge?: string;
}

interface NavSection {
  title: string;
  icon: any;
  items: SubNavItem[];
  roleRequired?: 'author' | 'moderator' | 'admin';
}

export function GlobalSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useUiStore();

  // Multi-tier expanded sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    knowledge: true,
    studio: true,
    admin: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isUserAuthor = user ? canAuthor(user.account.roles) : false;
  const isUserModerator = user ? canModerate(user.account.roles) : false;
  const isUserAdmin = user ? isAdmin(user.account.roles) : false;

  const sections: { key: string; section: NavSection }[] = [
    {
      key: 'knowledge',
      section: {
        title: 'Hub Tri Thức',
        icon: Compass,
        items: [
          { title: 'Khám phá tổng quan', href: '/' },
          { title: 'Dòng tin bài viết', href: '/articles' },
          { title: 'Bộ sưu tập Series', href: '/series' },
          { title: 'Tác giả nổi bật', href: '/contributors' },
          { title: 'Tìm kiếm nâng cao', href: '/search' },
        ],
      },
    },
    ...(isUserAuthor
      ? [
          {
            key: 'studio',
            section: {
              title: 'Studio Tác Giả',
              icon: LayoutDashboard,
              roleRequired: 'author' as const,
              items: [
                { title: 'Tổng quan bài viết', href: '/dashboard' },
                { title: 'Soạn bài viết mới', href: '/editor/new', badge: 'Mới' },
                { title: 'Quản lý Series', href: '/dashboard/series' },
                { title: 'Thư viện Media', href: '/dashboard/media' },
                { title: 'Kho bài đã lưu', href: '/dashboard/bookmarks' },
                { title: 'Bài viết đã thích', href: '/dashboard/likes' },
                { title: 'Thẻ đang theo dõi', href: '/dashboard/following-tags' },
                { title: 'Hồ sơ chuyên gia', href: '/dashboard/profile' },
              ],
            },
          },
        ]
      : []),
    ...(isUserModerator
      ? [
          {
            key: 'admin',
            section: {
              title: isUserAdmin ? 'Quản Trị Hệ Thống' : 'Trung Tâm Kiểm Duyệt',
              icon: Shield,
              roleRequired: 'moderator' as const,
              items: [
                ...(isUserAdmin ? [{ title: 'Tổng quan Platform', href: '/admin' }] : []),
                { title: 'Duyệt bài viết (Reviews)', href: '/admin/article-reviews', badge: 'Queue' },
                ...(isUserAdmin
                  ? [
                      { title: 'Cây danh mục', href: '/admin/categories' },
                      { title: 'Bộ thẻ Tags', href: '/admin/tags' },
                      { title: 'Người dùng & RBAC', href: '/admin/users' },
                    ]
                  : []),
                { title: 'Kiểm duyệt vi phạm', href: '/admin/moderation' },
                ...(isUserAdmin ? [{ title: 'Nhật ký Audit Logs', href: '/admin/audit-logs' }] : []),
              ],
            },
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in-0 duration-200"
        />
      )}

      {/* Sidebar Container: Fixed Left on Desktop, Drawer on Mobile */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-40 flex flex-col border-r border-white/[0.08] dark:border-white/[0.06] bg-card/60 dark:bg-[#090D16]/80 backdrop-blur-2xl transition-all duration-300 ease-in-out",
          // Desktop width
          sidebarCollapsed ? "md:w-18" : "md:w-64",
          // Mobile open/close transform
          sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm text-foreground">
              Danh mục điều hướng
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Tree */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
          {sections.map(({ key, section }) => {
            const Icon = section.icon;
            const isOpen = openSections[key] ?? true;

            return (
              <div key={key} className="space-y-1.5">
                {/* Section Header Button */}
                {!sidebarCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-muted-foreground/80 hover:text-foreground uppercase tracking-wider rounded-xl hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-purple-400 group-hover:text-cyan-400 transition-colors" />
                      <span>{section.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground/60",
                        isOpen ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>
                ) : (
                  /* Collapsed Icon Pill */
                  <div
                    className="flex justify-center py-2"
                    title={section.title}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-purple-400">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* Sub Menu Links */}
                {(isOpen || sidebarCollapsed) && (
                  <div className={cn("space-y-1", !sidebarCollapsed ? "pl-2" : "")}>
                    {section.items.map((item) => {
                      const isActive =
                        item.href === '/'
                          ? pathname === '/'
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          title={sidebarCollapsed ? item.title : undefined}
                          className={cn(
                            "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14px] font-medium transition-all duration-200 group",
                            sidebarCollapsed ? "justify-center px-0 py-2.5" : "",
                            isActive
                              ? "bg-muted text-foreground font-semibold border-l-2 border-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                          )}
                        >
                          {/* Dot indicator if not collapsed */}
                          {!sidebarCollapsed && (
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all",
                                isActive
                                  ? "bg-primary scale-125"
                                  : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60"
                              )}
                            />
                          )}

                          {/* Link title */}
                          {!sidebarCollapsed && (
                            <span className="truncate flex-1">{item.title}</span>
                          )}

                          {/* Optional badge */}
                          {!sidebarCollapsed && item.badge && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                              {item.badge}
                            </span>
                          )}

                          {/* Collapsed initial avatar tooltip fallback */}
                          {sidebarCollapsed && (
                            <span className="text-[14px] font-bold text-muted-foreground group-hover:text-cyan-400">
                              {item.title.slice(0, 2)}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer Pro-Tip */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-white/5">
            <div className="rounded-2xl p-3 bg-muted/50 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400">
                <Zap className="w-3.5 h-3.5" />
                <span>Nexa Enterprise</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Cùng học hỏi, chia sẻ và phát triển kiến thức kỹ thuật.
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
