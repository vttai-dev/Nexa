'use client';

import Link from 'next/link';
import { ArrowRight, PenTool, UserPlus } from 'lucide-react';
import { canAuthor } from '@/lib/types/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Button } from '@/components/ui/button';

export function CommunityCtaActions() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  if (status === 'loading') {
    return (
      <div className="mt-6 flex h-10 items-center gap-3" aria-hidden="true">
        <div className="h-9 w-36 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-9 w-32 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  const isAuthenticated = status === 'authenticated' && user !== null;
  const isAuthor = user !== null && canAuthor(user.account.roles);
  const primaryHref = isAuthor ? '/editor/new' : isAuthenticated ? '/author-registration' : '/register';
  const primaryLabel = isAuthor ? 'Soạn bài ngay' : isAuthenticated ? 'Đăng ký tác giả' : 'Đăng ký tài khoản';

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Button asChild className="rounded-xl font-medium shadow-md shadow-primary/20">
        <Link href={primaryHref}>
          {isAuthenticated ? <PenTool className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {primaryLabel}
        </Link>
      </Button>
      {!isAuthor && (
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={isAuthenticated ? '/articles' : '/login'}>
            {isAuthenticated ? 'Khám phá bài viết' : 'Đăng nhập'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
