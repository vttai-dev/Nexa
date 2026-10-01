import { api } from './client';
import type { MediaAssetDto, PagedResult, PageRequest } from '@/lib/types/api';

function toQuery(p: PageRequest = {}): string {
  const params = new URLSearchParams();
  if (p.page !== undefined) params.set('page', String(p.page));
  if (p.pageSize !== undefined) params.set('pageSize', String(p.pageSize));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const mediaApi = {
  uploadImage: async (file: File): Promise<MediaAssetDto> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<MediaAssetDto>('/media/images', formData);
  },

  uploadProfileImage: async (file: File): Promise<MediaAssetDto> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<MediaAssetDto>('/media/profile-images', formData);
  },

  uploadFile: async (file: File): Promise<MediaAssetDto> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<MediaAssetDto>('/media/files', formData);
  },

  listMine: (p: PageRequest = {}): Promise<PagedResult<MediaAssetDto>> =>
    api.get<PagedResult<MediaAssetDto>>(`/me/media${toQuery(p)}`),

  deleteMedia: (id: string): Promise<void> =>
    api.delete<void>(`/media/${id}`),
};
