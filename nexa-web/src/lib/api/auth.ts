import { api } from './client';
import { useCsrfStore } from '@/lib/stores/csrf.store';
import type {
  AccountAvailabilityDto, RegisterRequest, LoginRequest, RegisteredDto, DevelopmentMessageDto,
} from '@/lib/types/api';

export const authApi = {
  getCsrf: () => useCsrfStore.getState().fetch(),
  register: (data: RegisterRequest) => api.post<RegisteredDto>('/auth/register', data),
  checkUserName: (userName: string) =>
    api.get<AccountAvailabilityDto>(`/auth/availability/user-name/${encodeURIComponent(userName)}`),
  checkEmail: (email: string) =>
    api.get<AccountAvailabilityDto>(`/auth/availability/email?email=${encodeURIComponent(email)}`),
  enableAuthorRole: () => api.post<void>('/me/author', {}),
  login: (data: LoginRequest) => api.post<void>('/auth/login', data),
  logout: () => api.post<void>('/auth/logout'),
  requestEmailVerification: (email: string) => api.post<void>('/auth/email/verification', { email }),
  confirmEmail: (email: string, token: string) => api.post<void>('/auth/email/verification/confirm', { email, token }),
  requestPhoneVerification: (email: string) => api.post<void>('/auth/phone/verification', { email }),
  confirmPhone: (email: string, token: string) => api.post<void>('/auth/phone/verification/confirm', { email, token }),
  requestPasswordReset: (email: string) => api.post<void>('/auth/password/forgot', { email }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    api.post<void>('/auth/password/reset', { email, token, newPassword }),
  getDevelopmentMessages: (email: string) =>
    api.get<DevelopmentMessageDto[]>(`/auth/dev/outbox?recipient=${encodeURIComponent(email)}`),
};
