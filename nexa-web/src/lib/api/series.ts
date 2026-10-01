import { api } from './client';
import type { 
  ArticleSeriesSummaryDto, 
  ArticleSeriesDto, 
  ArticleSeriesInput, 
  PagedResult, 
  PageRequest 
} from '@/lib/types/api';

function toQuery(p: PageRequest = {}): string {
  const params = new URLSearchParams();
  if (p.page !== undefined) params.set('page', String(p.page));
  if (p.pageSize !== undefined) params.set('pageSize', String(p.pageSize));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const seriesApi = {
  listMine: (p: PageRequest = {}): Promise<PagedResult<ArticleSeriesSummaryDto>> =>
    api.get<PagedResult<ArticleSeriesSummaryDto>>(`/me/series${toQuery(p)}`),

  create: (data: ArticleSeriesInput): Promise<ArticleSeriesSummaryDto> =>
    api.post<ArticleSeriesSummaryDto>('/me/series', data),

  update: (id: string, data: ArticleSeriesInput): Promise<void> =>
    api.put<void>(`/me/series/${id}`, data),

  delete: (id: string): Promise<void> =>
    api.delete<void>(`/me/series/${id}`),

  addArticle: (seriesId: string, articleId: string): Promise<void> =>
    api.put<void>(`/me/series/${seriesId}/articles/${articleId}`),

  removeArticle: (seriesId: string, articleId: string): Promise<void> =>
    api.delete<void>(`/me/series/${seriesId}/articles/${articleId}`),

  reorderArticles: (seriesId: string, articleIds: string[]): Promise<void> =>
    api.put<void>(`/me/series/${seriesId}/articles/order`, { articleIds }),

  getBySlug: (slug: string): Promise<ArticleSeriesDto> =>
    api.get<ArticleSeriesDto>(`/series/${encodeURIComponent(slug)}`),

  getUserSeries: (userName: string, p: PageRequest = {}): Promise<PagedResult<ArticleSeriesSummaryDto>> =>
    api.get<PagedResult<ArticleSeriesSummaryDto>>(`/users/${encodeURIComponent(userName)}/series${toQuery(p)}`),
};
