import { apiFetch } from './api';
import type { AppNotification } from '../types';

export const notificationService = {
  async getNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false): Promise<AppNotification[]> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      });
      const response = await apiFetch<{success: boolean, data: AppNotification[]}>(`/notifications?${queryParams}`);
      if (response && response.success) {
        return response.data;
      }
      return [];
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiFetch<{success: boolean, data: {count: number}}>('/notifications/unread-count');
      if (response && response.success && response.data) {
        return response.data.count;
      }
      return 0;
    } catch (e) {
      console.error('Failed to fetch unread count:', e);
      return 0;
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    try {
      const response = await apiFetch<{success: boolean}>(`/notifications/${id}/read`, { method: 'PATCH' });
      return !!response?.success;
    } catch (e) {
      console.error('Failed to mark read:', e);
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await apiFetch<{success: boolean}>(`/notifications/read-all`, { method: 'PATCH' });
      return !!response?.success;
    } catch (e) {
      console.error('Failed to mark all read:', e);
      return false;
    }
  }
};
