'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useCsrfStore } from '@/lib/stores/csrf.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401/403/404
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if ([401, 403, 404].includes(status)) return false;
        }
        return failureCount < 2;
      },
    },
  },
});

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const fetchCsrf = useCsrfStore((s) => s.fetch);

  useEffect(() => {
    // Boot: fetch CSRF token then check auth status
    fetchCsrf().then(() => initialize());
  }, [fetchCsrf, initialize]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppBootstrap>{children}</AppBootstrap>
    </QueryClientProvider>
  );
}
