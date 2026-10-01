import { api } from './client';
import type {
  CommentDto, 
  CommentInput, 
  UpdateCommentRequest, 
  CreatedCommentDto, 
  PagedResult, 
  PageRequest,
} from '@/lib/types/api';

function toQuery(p: PageRequest = {}): string {
  const params = new URLSearchParams();
  if (p.page !== undefined) params.set('page', String(p.page));
  if (p.pageSize !== undefined) params.set('pageSize', String(p.pageSize));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const commentsApi = {
  list: (articleId: string, page: PageRequest = {}) =>
    api.get<PagedResult<CommentDto>>(`/articles/${articleId}/comments${toQuery(page)}`),

  listBySlug: (slug: string, page: PageRequest = {}) =>
    api.get<PagedResult<CommentDto>>(`/articles/${encodeURIComponent(slug)}/comments${toQuery(page)}`),

  create: (articleId: string, data: CommentInput) =>
    api.post<CreatedCommentDto>(`/articles/${articleId}/comments`, data),

  createBySlug: (slug: string, data: CommentInput) =>
    api.post<CreatedCommentDto>(`/articles/${encodeURIComponent(slug)}/comments`, data),

  getReplies: (commentId: string, page: PageRequest = {}) =>
    api.get<PagedResult<CommentDto>>(`/comments/${commentId}/replies${toQuery(page)}`),

  listMine: (page: PageRequest = {}) =>
    api.get<PagedResult<CommentDto>>(`/me/comments${toQuery(page)}`),

  update: (id: string, data: UpdateCommentRequest) =>
    api.put<void>(`/comments/${id}`, data),

  delete: (id: string, version: string) =>
    api.delete<void>(`/comments/${id}?version=${encodeURIComponent(version)}`),
};
