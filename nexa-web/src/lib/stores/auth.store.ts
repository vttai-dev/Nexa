// ============================================================
// Auth Store — Zustand (Real Backend Authentication)
// ============================================================
import { create } from 'zustand';
import type { MeDto } from '@/lib/types/api';

const REQUEST_TIMEOUT_MS = 10_000;
const LEGACY_DEMO_STORAGE_KEY = 'nexa-demo-session-v1';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: MeDto | null;
  status: AuthStatus;
  initialize: () => Promise<MeDto | null>;
  setUser: (user: MeDto | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  initialize: async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (res.ok) {
        const data: MeDto = await res.json();
        set({ user: data, status: 'authenticated' });
        return data;
      } else {
        set({ user: null, status: 'unauthenticated' });
        return null;
      }
    } catch {
      set({ user: null, status: 'unauthenticated' });
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  },

  setUser: (user) => {
    set({ user, status: user ? 'authenticated' : 'unauthenticated' });
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY);
    }
    set({ user: null, status: 'unauthenticated' });
  },
}));

export const authStore = useAuthStore;

