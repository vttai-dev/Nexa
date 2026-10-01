import { api } from './client';
import type {
  CategoryDto, 
  CategoryInput, 
  TagDto, 
  TagInput, 
  CreatedIdDto, 
  PagedResult, 
  PageRequest, 
  TagStatsDto,
  CategoryStatsDto,
  TagTrendDto,
} from '@/lib/types/api';

function toQuery(p: PageRequest = {}): string {
  const params = new URLSearchParams();
  if (p.page !== undefined) params.set('page', String(p.page));
  if (p.pageSize !== undefined) params.set('pageSize', String(p.pageSize));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const taxonomyApi = {
  // Categories
  listCategories: (page: PageRequest = { pageSize: 100 }) =>
    api.get<PagedResult<CategoryDto>>(`/categories${toQuery(page)}`),
  createCategory: (data: CategoryInput) => api.post<CreatedIdDto>('/categories', data),
  updateCategory: (id: string, data: CategoryInput) => api.put<void>(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<void>(`/categories/${id}`),

  listPopularCategories: (page: PageRequest = {}) =>
    api.get<PagedResult<CategoryStatsDto>>(`/categories/popular${toQuery(page)}`),
  getCategoryStats: (id: string) => api.get<CategoryStatsDto>(`/categories/${id}/stats`),
  getCategoryBySlug: (slug: string) => api.get<CategoryStatsDto>(`/categories/by-slug/${encodeURIComponent(slug)}`),

  // Tags
  listTags: (page: PageRequest = { pageSize: 100 }) =>
    api.get<PagedResult<TagDto>>(`/tags${toQuery(page)}`),
  createTag: (data: TagInput) => api.post<CreatedIdDto>('/tags', data),
  updateTag: (id: string, data: TagInput) => api.put<void>(`/tags/${id}`, data),
  deleteTag: (id: string) => api.delete<void>(`/tags/${id}`),

  listPopularTags: (page: PageRequest = {}) =>
    api.get<PagedResult<TagStatsDto>>(`/tags/popular${toQuery(page)}`),
  getTagStats: (id: string) => api.get<TagStatsDto>(`/tags/${id}/stats`),
  getTagBySlug: (slug: string) => api.get<TagStatsDto>(`/tags/by-slug/${encodeURIComponent(slug)}`),
  listTrendingTags: (days: number = 7, page: PageRequest = {}) =>
    api.get<PagedResult<TagTrendDto>>(`/tags/trending?days=${days}&page=${page.page ?? 1}&pageSize=${page.pageSize ?? 20}`),
};
