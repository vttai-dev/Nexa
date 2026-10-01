import { api } from './client';
import type { ArticleSummaryDto, PagedResult, PageRequest, TagStatsDto } from '@/lib/types/api';

function toQuery(p: PageRequest) {
  return `?page=${p.page ?? 1}&pageSize=${p.pageSize ?? 20}`;
}

export const engagementApi = {
  like: (articleId: string) => api.put<void>(`/articles/${articleId}/like`),
  unlike: (articleId: string) => api.delete<void>(`/articles/${articleId}/like`),
  bookmark: (articleId: string) => api.put<void>(`/articles/${articleId}/bookmark`),
  unbookmark: (articleId: string) => api.delete<void>(`/articles/${articleId}/bookmark`),
  myBookmarks: (page: PageRequest = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(`/me/bookmarks${toQuery(page)}`),
  myLikes: (page: PageRequest = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(`/me/likes${toQuery(page)}`),
  follow: (userId: string) => api.put<void>(`/users/${userId}/follow`),
  unfollow: (userId: string) => api.delete<void>(`/users/${userId}/follow`),
  getUserFollowState: (userId: string) =>
    api.get<{ targetId: string; following: boolean }>(`/users/${userId}/follow-state`),
  followTag: (tagId: string) => api.put<void>(`/tags/${tagId}/follow`),
  unfollowTag: (tagId: string) => api.delete<void>(`/tags/${tagId}/follow`),
  getTagFollowState: (tagId: string) =>
    api.get<{ targetId: string; following: boolean }>(`/tags/${tagId}/follow-state`),
  listFollowingTags: (page: PageRequest = {}) =>
    api.get<PagedResult<TagStatsDto>>(`/me/tags/following${toQuery(page)}`),
};
