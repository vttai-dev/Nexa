'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { canModerate, isAdmin } from '@/lib/types/api';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Unauthorized403View } from '@/components/auth/Unauthorized403View';
import { ModuleErrorBoundary } from '@/components/system/module-error-boundary';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Shield, Tags, FolderTree, Users, Flag, ScrollText, LayoutDashboard, FileCheck2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return <PageLoader />;
  }

  if (!user || !canModerate(user.account.roles)) {
    return <Unauthorized403View requiredRole="Admin" targetPath={pathname} />;
  }

  const adminOnlyPath =
    pathname === '/admin' ||
    ['/admin/categories', '/admin/tags', '/admin/users', '/admin/audit-logs'].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

  if (adminOnlyPath && !isAdmin(user.account.roles)) {
    return <Unauthorized403View requiredRole="Admin" targetPath={pathname} />;
  }

  const nav = isAdmin(user.account.roles)
    ? [
        { name: 'Tổng quan & RBAC', href: '/admin', icon: LayoutDashboard },
        { name: 'Duyệt bài viết', href: '/admin/article-reviews', icon: FileCheck2 },
        { name: 'Danh mục', href: '/admin/categories', icon: FolderTree },
        { name: 'Thẻ (Tags)', href: '/admin/tags', icon: Tags },
        { name: 'Quản lý Users', href: '/admin/users', icon: Users },
        { name: 'Kiểm duyệt báo cáo', href: '/admin/moderation', icon: Flag },
        { name: 'Nhật ký hệ thống', href: '/admin/audit-logs', icon: ScrollText },
      ]
    : [
        { name: 'Duyệt bài viết', href: '/admin/article-reviews', icon: FileCheck2 },
        { name: 'Kiểm duyệt báo cáo', href: '/admin/moderation', icon: Flag },
      ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 space-y-8">
      <div className="flex items-center gap-3.5 pb-6 border-b border-border/60">
        <div className="h-11 w-11 rounded-2xl bg-muted border border-border flex items-center justify-center text-primary">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isAdmin(user.account.roles) ? 'Khu vực Quản trị Hệ thống' : 'Trung tâm Kiểm duyệt & Điều hành'}
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {isAdmin(user.account.roles)
              ? 'Cổng điều hành & quản lý phân quyền nền tảng Nexa'
              : 'Dành cho Moderator và Ban biên tập'}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-60 shrink-0">
          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-3 shadow-lg">
            <nav className="flex flex-col gap-1.5">
              {nav.map((item) => {
                const active =
                  item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[14px] font-semibold',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="flex-1 min-w-0 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
          <ModuleErrorBoundary moduleName="Enterprise Governance (/admin)">
            {children}
          </ModuleErrorBoundary>
        </main>
      </div>
    </div>
  );
}
