import { api } from './client';
import type { PagedResult, ReportDto, ReportFilter, ReportDecisionRequest } from '@/lib/types/api';

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const moderationApi = {
  listReports: (filter: ReportFilter = {}) =>
    api.get<PagedResult<ReportDto>>(
      `/moderation/reports${buildQuery({
        status: filter.status,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`
    ),
  resolveReport: (id: string, decision: ReportDecisionRequest) =>
    api.put<void>(`/moderation/reports/${id}/decision`, decision),
};
