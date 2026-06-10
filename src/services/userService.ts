import api from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

const saveAuth = (response: AuthResponse) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('accessToken', response.accessToken);

  if (response.refreshToken) {
    localStorage.setItem('refreshToken', response.refreshToken);
  }

  localStorage.setItem('currentUser', JSON.stringify(response.user));
};

export const userService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    saveAuth(response.data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout').catch(() => undefined);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      throw new Error('No user logged in');
    } catch (error) {
      throw error;
    }
  },

  getUserById: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/api/users/${userId}/profile`);
    return response.data;
  },

  updateProfile: async (userId: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/api/users/${userId}/profile`, data);
    return response.data;
  },

  followUser: async (userId: number): Promise<void> => {
    await api.post(`/api/users/${userId}/follow`);
  },

  unfollowUser: async (userId: number): Promise<void> => {
    await api.delete(`/api/users/${userId}/follow`);
  },

  getFollowers: async (userId: number, page: number = 0, size: number = 10): Promise<User[]> => {
    const response = await api.get<User[]>(`/api/users/${userId}/followers`, {
      params: { page, size },
    });
    return response.data;
  },

  getFollowing: async (userId: number): Promise<User[]> => {
    const response = await api.get<User[]>(`/api/users/${userId}/following`);
    return response.data;
  },
};
