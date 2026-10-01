'use client';

import React from 'react';
import { useUiStore } from '@/lib/stores/ui.store';
import { GlobalNavbar } from '@/components/layout/global-navbar';
import { GlobalSidebar } from '@/components/layout/global-sidebar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export function RootLayoutShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-purple-500/30 selection:text-cyan-200">
      {/* 1. Fixed Intelligent Top Navbar */}
      <GlobalNavbar />

      {/* 2. Workspace Body: Left Sidebar + Viewport */}
      <div className="flex-1 flex w-full relative">
        {/* Left Hierarchical Sidebar */}
        <GlobalSidebar />

        {/* 3. Decoupled Main Viewport */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-[padding-left] duration-300 ease-in-out',
            sidebarCollapsed ? 'md:pl-18' : 'md:pl-64'
          )}
        >
          <main className="flex-1 w-full min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <Footer />
        </div>
      </div>

      {/* Global Notifications & Toasts */}
      <Toaster />
    </div>
  );
}
