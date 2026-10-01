import { API_BASE_URL, api } from './client';
import type { PagedResult, NotificationDto, NotificationFilter, UnreadCountDto } from '@/lib/types/api';

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const notificationsApi = {
  streamUrl: `${API_BASE_URL}/notifications/stream`,
  list: (filter: NotificationFilter = {}) =>
    api.get<PagedResult<NotificationDto>>(
      `/notifications${buildQuery({
        unreadOnly: filter.unreadOnly,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`
    ),
  getUnreadCount: () => api.get<UnreadCountDto>('/notifications/unread-count'),
  markAsRead: (id: string) => api.post<void>(`/notifications/${id}/read`),
  markAllAsRead: () => api.post<void>('/notifications/read-all'),
  deleteNotification: (id: string) => api.delete<void>(`/notifications/${id}`),
  deleteRead: () => api.delete<{ count: number }>('/notifications/read'),
};
