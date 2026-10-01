import { canAuthor, canModerate, isAdmin, type MeDto } from '@/lib/types/api';

export function authenticatedLandingPath(user: MeDto): string {
  const roles = user.account.roles;
  if (isAdmin(roles)) return '/admin';
  if (canModerate(roles)) return '/admin/article-reviews';
  return canAuthor(roles) ? '/dashboard' : '/dashboard/profile';
}
