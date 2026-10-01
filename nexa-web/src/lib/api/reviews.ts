import { api } from './client';
import type { 
  ArticleReviewDto, 
  ArticleReviewQueueItemDto, 
  ArticleReviewFilter, 
  SubmitArticleReviewRequest, 
  ArticleReviewDecisionRequest, 
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

export const reviewsApi = {
  submit: (articleId: string, data: SubmitArticleReviewRequest): Promise<ArticleReviewDto> =>
    api.post<ArticleReviewDto>(`/me/articles/${articleId}/reviews`, data),

  listForArticle: (articleId: string, p: PageRequest = {}): Promise<PagedResult<ArticleReviewDto>> =>
    api.get<PagedResult<ArticleReviewDto>>(`/me/articles/${articleId}/reviews${toQuery(p)}`),

  withdraw: (reviewId: string): Promise<void> =>
    api.delete<void>(`/me/article-reviews/${reviewId}`),

  listQueue: (filter: ArticleReviewFilter = {}): Promise<PagedResult<ArticleReviewQueueItemDto>> => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.page) params.set('page', String(filter.page));
    if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
    const qs = params.toString();
    return api.get<PagedResult<ArticleReviewQueueItemDto>>(`/moderation/article-reviews${qs ? `?${qs}` : ''}`);
  },

  getReview: (reviewId: string): Promise<ArticleReviewQueueItemDto> =>
    api.get<ArticleReviewQueueItemDto>(`/moderation/article-reviews/${reviewId}`),

  decision: (reviewId: string, data: ArticleReviewDecisionRequest): Promise<void> =>
    api.put<void>(`/moderation/article-reviews/${reviewId}/decision`, data),
};
