import { api } from './client';
import type { PagedResult, SearchResultDto, SearchArticleResultDto, SearchUserResultDto, SearchTagResultDto, SearchFilter, SearchSuggestionsDto } from '@/lib/types/api';

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const searchApi = {
  searchAll: (filter: SearchFilter = {}) =>
    api.get<SearchResultDto>(
      `/search${buildQuery({
        query: filter.query,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`
    ),
  searchArticles: (filter: SearchFilter = {}) =>
    api.get<PagedResult<SearchArticleResultDto>>(
      `/search/articles${buildQuery({
        query: filter.query,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`
    ),
  searchUsers: (filter: SearchFilter = {}) =>
    api.get<PagedResult<SearchUserResultDto>>(
      `/search/users${buildQuery({
        query: filter.query,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`
    ),
  searchTags: (filter: SearchFilter = {}) =>
    api.get<PagedResult<SearchTagResultDto>>(
      `/search/tags${buildQuery({
        query: filter.query,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`
    ),
  getSuggestions: (query: string) =>
    api.get<SearchSuggestionsDto>(`/search/suggestions${buildQuery({ query })}`),
};
