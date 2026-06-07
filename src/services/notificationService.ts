import api from './api';
import { Notification } from '@/types';

export const notificationService = {
  getNotifications: async (recipientId: string, limit = 20): Promise<Notification[]> => {
    const response = await api.get<Notification[]>(`/api/notifications`, {
      params: { recipientId, limit },
    });
    return response.data;
  },

  createNotification: async (notification: Partial<Notification>): Promise<Notification> => {
    const response = await api.post<Notification>(`/api/notifications`, notification);
    return response.data;
  },

  markAsRead: async (notificationId: number | string): Promise<void> => {
    await api.post(`/api/notifications/${notificationId}/read`);
  },

  deleteNotification: async (notificationId: number | string): Promise<void> => {
    await api.delete(`/api/notifications/${notificationId}`);
  },
};
