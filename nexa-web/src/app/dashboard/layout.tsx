'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { ModuleErrorBoundary } from '@/components/system/module-error-boundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireRole="Author">
      <ModuleErrorBoundary moduleName="Author Studio (/dashboard)">
        {children}
      </ModuleErrorBoundary>
    </RouteGuard>
  );
}
