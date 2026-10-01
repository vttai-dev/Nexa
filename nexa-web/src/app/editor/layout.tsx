'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { ModuleErrorBoundary } from '@/components/system/module-error-boundary';

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireRole="Author">
      <ModuleErrorBoundary moduleName="CMS Studio (/editor)">
        {children}
      </ModuleErrorBoundary>
    </RouteGuard>
  );
}
