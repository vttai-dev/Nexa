// ============================================================
// CSRF Store — Zustand
// ============================================================
import { create } from 'zustand';

const REQUEST_TIMEOUT_MS = 10_000;
let csrfRequest: Promise<string | null> | null = null;

interface CsrfState {
  token: string | null;
  isFetching: boolean;
  fetch: () => Promise<string | null>;
  clear: () => void;
}

export const useCsrfStore = create<CsrfState>((set) => ({
  token: null,
  isFetching: false,

  fetch: async () => {
    if (csrfRequest) return csrfRequest;
    set({ isFetching: true });
    const request = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/csrf`,
          { credentials: 'include', cache: 'no-store', signal: controller.signal }
        );
        if (!res.ok) {
          set({ token: null, isFetching: false });
          return null;
        }
        const data = await res.json();
        set({ token: data.requestToken as string, isFetching: false });
        return data.requestToken as string;
      } catch {
        set({ token: null, isFetching: false });
        return null;
      } finally {
        window.clearTimeout(timeout);
      }
    })();
    csrfRequest = request;
    try {
      return await request;
    } finally {
      if (csrfRequest === request) csrfRequest = null;
    }
  },

  clear: () => set({ token: null }),
}));
