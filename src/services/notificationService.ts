import api from './api';

export interface NotificationDto {
  id: string;
  recipientId: string;
  type: string;
  message: string;
  referenceId?: string | null;
  readFlag: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (recipientId: string): Promise<NotificationDto[]> => {
    const response = await api.get<NotificationDto[]>(`/api/notifications`, {
      params: { recipientId },
    });
    return response.data;
  },

  createNotification: async (notification: Partial<NotificationDto>): Promise<NotificationDto> => {
    const response = await api.post<NotificationDto>(`/api/notifications`, notification);
    return response.data;
  },

  markAsRead: async (notificationId: number | string): Promise<void> => {
    await api.post(`/api/notifications/${notificationId}/read`);
  },

  deleteNotification: async (notificationId: number | string): Promise<void> => {
    await api.delete(`/api/notifications/${notificationId}`);
  },
};
