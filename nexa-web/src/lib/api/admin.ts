import { api } from './client';
import type {
  PagedResult,
  AdminUserDto,
  AdminUserDetailDto,
  AdminUserFilter,
  UpdateRolesRequest,
  LockUserRequest,
  AuditLogDto,
  AuditLogFilter,
  AdminStatsDto,
  AdminRecentActivityDto,
  ArticleReviewFilter,
  ArticleReviewQueueItemDto,
  ArticleDto,
  ArticleSummaryDto,
  CommentDto,
  AdminUserActivityDto,
} from '@/lib/types/api';

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const adminApi = {
  listUsers: (filter: AdminUserFilter = {}) =>
    api.get<PagedResult<AdminUserDto>>(
      `/admin/users${buildQuery({
        search: filter.search,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`
    ),
  getUser: (id: string) => api.get<AdminUserDetailDto>(`/admin/users/${id}`),
  updateRoles: (id: string, data: UpdateRolesRequest) => api.put<void>(`/admin/users/${id}/roles`, data),
  lockUser: (id: string, data: LockUserRequest) => api.post<void>(`/admin/users/${id}/lock`, data),
  unlockUser: (id: string) => api.post<void>(`/admin/users/${id}/unlock`),
  listAuditLogs: (filter: AuditLogFilter = {}) =>
    api.get<PagedResult<AuditLogDto>>(
      `/admin/audit-logs${buildQuery({
        action: filter.action,
        targetType: filter.targetType,
        actorId: filter.actorId,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`
    ),
  getStats: () => api.get<AdminStatsDto>('/admin/stats'),
  getRecentActivity: (take = 5) => api.get<AdminRecentActivityDto>(`/admin/recent-activity?take=${take}`),
  getArticle: (id: string) => api.get<ArticleDto>(`/admin/articles/${id}`),
  listArticleReviews: (filter: ArticleReviewFilter = {}) =>
    api.get<PagedResult<ArticleReviewQueueItemDto>>(
      `/moderation/article-reviews${buildQuery({ status: filter.status ?? 'Pending', page: filter.page ?? 1, pageSize: filter.pageSize ?? 20 })}`
    ),
  listArticles: (filter: { page?: number; pageSize?: number; status?: string } = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(`/admin/articles${buildQuery(filter)}`),
  setFeatured: (id: string) => api.put<void>(`/admin/articles/${id}/featured`),
  unsetFeatured: (id: string) => api.delete<void>(`/admin/articles/${id}/featured`),
  listComments: (filter: { page?: number; pageSize?: number; articleId?: string; authorId?: string } = {}) =>
    api.get<PagedResult<CommentDto>>(`/admin/comments${buildQuery(filter)}`),
  decideArticleReview: (id: string, status: 'Approved' | 'Rejected', note?: string | null) =>
    api.put<void>(`/moderation/article-reviews/${id}/decision`, { status, note }),
  getUserActivity: (userId: string) => api.get<AdminUserActivityDto>(`/admin/users/${userId}/activity`),
};
