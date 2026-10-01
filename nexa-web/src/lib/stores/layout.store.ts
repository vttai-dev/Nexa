'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewportBreakpoint = 'mobile' | 'tablet' | 'desktop';

export interface GlobalSearchFilterState {
  query: string;
  tags: string[];
  language: string;
  timeRange: string;
  author: string;
}

export interface LayoutState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  viewportSize: ViewportBreakpoint;
  globalSearchFilter: GlobalSearchFilterState;
  simulatedCrashModule: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setViewportSize: (size: ViewportBreakpoint) => void;
  updateSearchFilter: (partial: Partial<GlobalSearchFilterState>) => void;
  resetSearchFilter: () => void;
  triggerSimulatedCrash: (moduleName: string | null) => void;
}

const DEFAULT_SEARCH_FILTER: GlobalSearchFilterState = {
  query: '',
  tags: [],
  language: 'Tất cả',
  timeRange: 'Mọi thời điểm',
  author: 'Tất cả tác giả',
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      viewportSize: 'desktop',
      globalSearchFilter: DEFAULT_SEARCH_FILTER,
      simulatedCrashModule: null,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setViewportSize: (viewportSize) => set({ viewportSize }),
      updateSearchFilter: (partial) =>
        set((state) => ({
          globalSearchFilter: { ...state.globalSearchFilter, ...partial },
        })),
      resetSearchFilter: () => set({ globalSearchFilter: DEFAULT_SEARCH_FILTER }),
      triggerSimulatedCrash: (moduleName) => set({ simulatedCrashModule: moduleName }),
    }),
    {
      name: 'nexa-layout-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        globalSearchFilter: state.globalSearchFilter,
      }),
    }
  )
);
