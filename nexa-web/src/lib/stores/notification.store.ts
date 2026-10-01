'use client';

import { create } from 'zustand';
import { toast } from '@/hooks/use-toast';

export interface SystemNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'security';
  isRead: boolean;
  createdAtUtc: string;
  articleSlug?: string;
}

interface NotificationState {
  notifications: SystemNotificationItem[];
  unreadCount: number;
  pushNotification: (payload: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'security';
    articleSlug?: string;
    silent?: boolean;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const INITIAL_NOTIFICATIONS: SystemNotificationItem[] = [
  {
    id: 'sys-notif-1',
    title: 'Hệ thống AI Product Design sẵn sàng',
    message: 'Chào mừng bạn đến với cổng tri thức kỹ thuật Nexa Enterprise Portal v2.4.',
    type: 'info',
    isRead: false,
    createdAtUtc: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    articleSlug: 'clean-architecture-in-depth',
  },
  {
    id: 'sys-notif-2',
    title: 'Bản nháp đã được đồng bộ',
    message: 'Bài viết "Clean Architecture trong .NET 10" đã được lưu tự động vào kho lưu trữ.',
    type: 'success',
    isRead: false,
    createdAtUtc: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    articleSlug: 'clean-architecture-in-depth',
  },
  {
    id: 'sys-notif-3',
    title: 'Cảnh báo Kiểm duyệt Nội dung',
    message: 'Có 2 báo cáo vi phạm mới đang chờ xử lý trong hàng đợi Moderation Queue.',
    type: 'warning',
    isRead: true,
    createdAtUtc: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.isRead).length,

  pushNotification: ({ title, message, type = 'info', articleSlug, silent = false }) => {
    const newItem: SystemNotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      message,
      type,
      isRead: false,
      createdAtUtc: new Date().toISOString(),
      articleSlug,
    };

    set((state) => {
      const updated = [newItem, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });

    if (!silent) {
      toast({
        title,
        description: message,
        variant: type === 'security' ? 'destructive' : 'default',
      });
    }
  },

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
