'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { authenticatedLandingPath } from '@/lib/utils/auth-navigation';
import { PageLoader } from '@/components/ui/loading-spinner';

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.replace(authenticatedLandingPath(user));
    }
  }, [router, status, user]);

  if (status !== 'unauthenticated') return <PageLoader />;
  return <>{children}</>;
}
