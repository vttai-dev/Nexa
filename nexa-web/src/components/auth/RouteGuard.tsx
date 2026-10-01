'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { canAuthor, canModerate, isAdmin } from '@/lib/types/api';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Unauthorized403View } from './Unauthorized403View';

interface RouteGuardProps {
  children: React.ReactNode;
  requireRole?: 'Member' | 'Author' | 'Moderator' | 'Admin';
}

export function RouteGuard({ children, requireRole = 'Member' }: RouteGuardProps) {
  const { user, status } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status === 'loading') {
    return <PageLoader />;
  }

  if (status === 'unauthenticated' || !user) {
    return <PageLoader />;
  }

  const roles = user.account.roles;

  if (requireRole === 'Admin' && !isAdmin(roles)) {
    return <Unauthorized403View requiredRole="Admin" targetPath={pathname} />;
  }

  if (requireRole === 'Moderator' && !canModerate(roles)) {
    return <Unauthorized403View requiredRole="Moderator / Admin" targetPath={pathname} />;
  }

  if (requireRole === 'Author' && !canAuthor(roles)) {
    return <Unauthorized403View requiredRole="Author" targetPath={pathname} />;
  }

  return <>{children}</>;
}
