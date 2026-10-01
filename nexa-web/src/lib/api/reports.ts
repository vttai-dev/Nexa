import { api } from './client';
import type { CreateReportRequest, CreatedIdDto } from '@/lib/types/api';

export const reportsApi = {
  create: (data: CreateReportRequest) => api.post<CreatedIdDto>('/reports', data),
};
