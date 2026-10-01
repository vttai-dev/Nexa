// ============================================================
// Base API Client — CSRF injection + error handling
// ============================================================
import { useCsrfStore } from '@/lib/stores/csrf.store';
import { useAuthStore } from '@/lib/stores/auth.store';
import type { ApiError } from '@/lib/types/api';

if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7210/api/v1';
const REQUEST_TIMEOUT_MS = 10_000;

export class NexaApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    public readonly title: string,
    public readonly traceId?: string
  ) {
    super(title);
    this.name = 'NexaApiError';
  }
}

async function parseError(res: Response): Promise<NexaApiError> {
  try {
    const body: ApiError = await res.json();
    const code = body.code ?? body.extensions?.code;
    const traceId = body.traceId ?? body.extensions?.traceId;
    return new NexaApiError(res.status, code, body.title, traceId);
  } catch {
    return new NexaApiError(res.status, undefined, res.statusText);
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs = REQUEST_TIMEOUT_MS, ...init } = options;
  const method = (init.method ?? 'GET').toUpperCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers = new Headers(init.headers);
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  if (isMutation) {
    let token = useCsrfStore.getState().token;
    if (!token) token = await useCsrfStore.getState().fetch();
    if (!token) {
      throw new NexaApiError(0, 'csrf_unavailable', 'Không lấy được mã bảo vệ yêu cầu. Vui lòng thử tải lại trang.');
    }
    headers.set('X-CSRF-TOKEN', token);
  }

  const payload = isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined);

  const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    body: payload,
  }, timeoutMs);

  // Auto-retry on invalid CSRF
  if (res.status === 400) {
    const clone = res.clone();
    try {
      const errBody: ApiError = await clone.json();
      if (errBody.code === 'invalid_csrf' || errBody.extensions?.code === 'invalid_csrf') {
        const newToken = await useCsrfStore.getState().fetch();
        if (newToken) {
          const retryHeaders = new Headers(headers);
          retryHeaders.set('X-CSRF-TOKEN', newToken);
          const retry = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
            ...init, headers: retryHeaders, credentials: 'include',
            body: payload,
          }, timeoutMs);
          if (retry.status === 401) useAuthStore.getState().clear();
          if (!retry.ok) throw await parseError(retry);
          if (retry.status === 204) return undefined as T;
          return retry.json() as Promise<T>;
        }
      }
    } catch (e) {
      if (e instanceof NexaApiError) throw e;
    }
    throw await parseError(res);
  }

  if (res.status === 401) useAuthStore.getState().clear();
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => apiRequest<T>(path, { method: 'POST', body: formData, timeoutMs: 60_000 }),
};

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit | undefined, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
