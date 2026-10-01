// Utility helpers
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'HH:mm dd/MM/yyyy', { locale: vi });
  } catch {
    return dateStr;
  }
}
