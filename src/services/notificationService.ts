import api from './api';
import { Notification } from '@/types';

export const notificationService = {
  getNotifications: async (userId: number, limit = 20): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/api/notifications', {
      params: { recipientId: userId, limit },
    });
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await api.post(`/api/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (userId: number): Promise<void> => {
    await api.post(`/api/notifications/${userId}/read-all`);
  },

  deleteNotification: async (notificationId: number): Promise<void> => {
    await api.delete(`/api/notifications/${notificationId}`);
  },
};
