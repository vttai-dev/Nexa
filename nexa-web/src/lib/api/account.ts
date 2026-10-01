import { api } from './client';
import type {
  MeDto, 
  ProfileDto, 
  UpdateProfileRequest,
  MeStatsDto,
  PublicProfileStatsDto,
  PublicFollowDto,
  PublicReputationDto,
  ArticleSummaryDto,
  PagedResult,
  PageRequest,
  ChangePasswordRequest,
} from '@/lib/types/api';

function toQuery(p: PageRequest = {}): string {
  const params = new URLSearchParams();
  if (p.page !== undefined) params.set('page', String(p.page));
  if (p.pageSize !== undefined) params.set('pageSize', String(p.pageSize));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const accountApi = {
  getMe: (): Promise<MeDto> => api.get<MeDto>('/me'),
  getPublicProfile: (userName: string): Promise<ProfileDto> => api.get<ProfileDto>(`/users/${encodeURIComponent(userName)}`),
  updateProfile: (data: UpdateProfileRequest): Promise<void> => api.put<void>('/me/profile', data),
  changePassword: (data: ChangePasswordRequest): Promise<void> => api.put<void>('/me/password', data),
  getStats: (): Promise<MeStatsDto> => api.get<MeStatsDto>('/me/stats'),
  getUserStats: (userName: string): Promise<PublicProfileStatsDto> => api.get<PublicProfileStatsDto>(`/users/${encodeURIComponent(userName)}/stats`),
  getUserFollowers: (userName: string, p: PageRequest = {}): Promise<PagedResult<PublicFollowDto>> =>
    api.get<PagedResult<PublicFollowDto>>(`/users/${encodeURIComponent(userName)}/followers${toQuery(p)}`),
  getUserFollowing: (userName: string, p: PageRequest = {}): Promise<PagedResult<PublicFollowDto>> =>
    api.get<PagedResult<PublicFollowDto>>(`/users/${encodeURIComponent(userName)}/following${toQuery(p)}`),
  getUserReputation: (userName: string): Promise<PublicReputationDto> =>
    api.get<PublicReputationDto>(`/users/${encodeURIComponent(userName)}/reputation`),
  getTopContributors: (take: number = 20): Promise<PublicReputationDto[]> =>
    api.get<PublicReputationDto[]>(`/contributors/top?take=${take}`),
  getUserArticles: (userName: string, p: PageRequest = {}): Promise<PagedResult<ArticleSummaryDto>> =>
    api.get<PagedResult<ArticleSummaryDto>>(`/users/${encodeURIComponent(userName)}/articles${toQuery(p)}`),
};
