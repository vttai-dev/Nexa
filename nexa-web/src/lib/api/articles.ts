// ============================================================
// Articles API — maps to /articles/* endpoints
// ============================================================
import { api } from './client';
import type {
  ArticleDto,
  ArticleSummaryDto,
  ArticleFilter,
  ArticleInput,
  UpdateArticleRequest,
  VersionRequest,
  CreatedArticleDto,
  PagedResult,
  PageRequest,
  ArticleMetadataDto,
  ArticleRevisionSummaryDto,
  ArticleRevisionDto,
  ArticleRevisionCompareDto,
  ArticleAutosaveResponse,
  ArticleSeoDto,
  ArticleEngagementDto,
  SlugAvailabilityDto,
  ArticleStatus,
} from '@/lib/types/api';

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const articlesApi = {
  /** GET /articles — public, published only */
  list: (filter: ArticleFilter = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(
      `/articles${buildQuery({
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
        categoryId: filter.categoryId,
        tagId: filter.tagId,
        authorId: filter.authorId,
      })}`
    ),

  /** GET /articles/{slug} — published only */
  getBySlug: (slug: string) =>
    api.get<ArticleDto>(`/articles/${encodeURIComponent(slug)}`),

  /** GET /articles/{slug}/metadata */
  getMetadata: (slug: string) =>
    api.get<ArticleMetadataDto>(`/articles/${encodeURIComponent(slug)}/metadata`),

  /** POST /articles/{slug}/views */
  recordView: (slug: string) =>
    api.post<void>(`/articles/${encodeURIComponent(slug)}/views`),

  recordShare: (slug: string) =>
    api.post<void>(`/articles/${encodeURIComponent(slug)}/shares`),

  /** POST /articles — create draft */
  create: (input: ArticleInput) =>
    api.post<CreatedArticleDto>('/articles', input),

  /** PUT /articles/{id} — update */
  update: (id: string, request: UpdateArticleRequest) =>
    api.put<void>(`/articles/${id}`, request),

  /** POST /articles/{id}/publish */
  publish: (id: string, version: string) =>
    api.post<void>(`/articles/${id}/publish`, { version } satisfies VersionRequest),

  /** POST /articles/{id}/archive */
  archive: (id: string, version: string) =>
    api.post<void>(`/articles/${id}/archive`, { version } satisfies VersionRequest),

  /** GET /me/articles — author's articles with status filter */
  listMine: (page: PageRequest & { status?: ArticleStatus } = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(
      `/me/articles${buildQuery({ page: page.page ?? 1, pageSize: page.pageSize ?? 20, status: page.status })}`
    ),

  /** GET /me/articles/{id} — author's specific article */
  getMine: (id: string) =>
    api.get<ArticleDto>(`/me/articles/${id}`),

  /** GET /me/articles/{id}/revisions */
  listRevisions: (articleId: string, page: PageRequest = {}) =>
    api.get<PagedResult<ArticleRevisionSummaryDto>>(
      `/me/articles/${articleId}/revisions${buildQuery({ page: page.page ?? 1, pageSize: page.pageSize ?? 20 })}`
    ),

  /** GET /me/articles/{id}/revisions/{revisionId} */
  getRevision: (articleId: string, revisionId: string) =>
    api.get<ArticleRevisionDto>(`/me/articles/${articleId}/revisions/${revisionId}`),

  /** GET /articles/popular */
  getPopular: (page: PageRequest = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(`/articles/popular${buildQuery({ page: page.page ?? 1, pageSize: page.pageSize ?? 20 })}`),

  /** GET /articles/featured */
  getFeatured: (page: PageRequest = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(`/articles/featured${buildQuery({ page: page.page ?? 1, pageSize: page.pageSize ?? 20 })}`),

  /** GET /articles/trending */
  getTrending: (days: number = 7, page: PageRequest = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(`/articles/trending${buildQuery({ days, page: page.page ?? 1, pageSize: page.pageSize ?? 20 })}`),

  /** GET /me/feed — followed authors & tags */
  getFeed: (page: PageRequest = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(`/me/feed${buildQuery({ page: page.page ?? 1, pageSize: page.pageSize ?? 20 })}`),

  /** GET /me/recommendations */
  getRecommendations: (page: PageRequest = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(`/me/recommendations${buildQuery({ page: page.page ?? 1, pageSize: page.pageSize ?? 20 })}`),

  /** GET /articles/{slug}/related */
  getRelated: (slug: string, page: PageRequest = {}) =>
    api.get<PagedResult<ArticleSummaryDto>>(`/articles/${encodeURIComponent(slug)}/related${buildQuery({ page: page.page ?? 1, pageSize: page.pageSize ?? 6 })}`),

  /** GET /articles/slug-availability/{slug} */
  checkSlugAvailability: (slug: string, exceptArticleId?: string) =>
    api.get<SlugAvailabilityDto>(`/articles/slug-availability/${encodeURIComponent(slug)}${buildQuery({ exceptArticleId })}`),

  /** PUT /me/articles/{id}/autosave */
  autosave: (id: string, data: { version: string; article: ArticleInput }) =>
    api.put<ArticleAutosaveResponse>(`/me/articles/${id}/autosave`, data),

  /** POST /me/articles/{id}/revisions/{revisionId}/restore */
  restoreRevision: (id: string, revisionId: string, version: string) =>
    api.post<void>(`/me/articles/${id}/revisions/${revisionId}/restore`, { version }),

  /** GET /me/articles/{id}/revisions/{fromId}/compare/{toId} */
  compareRevisions: (id: string, fromId: string, toId: string) =>
    api.get<ArticleRevisionCompareDto>(`/me/articles/${id}/revisions/${fromId}/compare/${toId}`),

  /** GET /me/articles/{id}/seo */
  getSeo: (id: string) =>
    api.get<ArticleSeoDto>(`/me/articles/${id}/seo`),

  /** PUT /me/articles/{id}/seo */
  updateSeo: (id: string, data: ArticleSeoDto) =>
    api.put<ArticleSeoDto>(`/me/articles/${id}/seo`, data),

  /** GET /articles/{slugOrId}/engagement */
  getEngagement: (slugOrId: string) =>
    api.get<ArticleEngagementDto>(`/articles/${encodeURIComponent(slugOrId)}/engagement`),

  /** PUT /articles/{slug}/like */
  likeBySlug: (slug: string) =>
    api.put<void>(`/articles/${encodeURIComponent(slug)}/like`),

  /** DELETE /articles/{slug}/like */
  unlikeBySlug: (slug: string) =>
    api.delete<void>(`/articles/${encodeURIComponent(slug)}/like`),

  /** PUT /articles/{slug}/bookmark */
  bookmarkBySlug: (slug: string) =>
    api.put<void>(`/articles/${encodeURIComponent(slug)}/bookmark`),

  /** DELETE /articles/{slug}/bookmark */
  unbookmarkBySlug: (slug: string) =>
    api.delete<void>(`/articles/${encodeURIComponent(slug)}/bookmark`),
};
