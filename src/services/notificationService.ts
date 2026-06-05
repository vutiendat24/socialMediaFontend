import api from './api';
import { Notification } from '@/types';

export const notificationService = {
  getNotifications: async (userId: number, limit = 20): Promise<Notification[]> => {
    const response = await api.get<Notification[]>(`/v1/notifications/${userId}`, {
      params: { limit },
    });
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await api.put(`/v1/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (userId: number): Promise<void> => {
    await api.put(`/v1/notifications/${userId}/read-all`);
  },

  deleteNotification: async (notificationId: number): Promise<void> => {
    await api.delete(`/v1/notifications/${notificationId}`);
  },
};
