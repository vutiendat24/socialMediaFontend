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
    const response = await api.post<AuthResponse>('/api/users/login', credentials);
    saveAuth(response.data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/api/users/register', data);
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
      const response = await api.get<User>('/api/users/me');
      return response.data;
    } catch (error) {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;

      if (storedUser) {
        return JSON.parse(storedUser);
      }

      throw error;
    }
  },

  getUserById: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/api/users/${userId}`);
    return response.data;
  },

  getUserByUsername: async (username: string): Promise<User> => {
    const response = await api.get<User>(`/api/users/username/${username}`);
    return response.data;
  },

  updateProfile: async (userId: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/api/users/${userId}`, data);
    return response.data;
  },

  followUser: async (userId: number): Promise<void> => {
    await api.post(`/api/users/${userId}/follow`);
  },

  unfollowUser: async (userId: number): Promise<void> => {
    await api.post(`/api/users/${userId}/unfollow`);
  },

  getFollowers: async (userId: number): Promise<User[]> => {
    const response = await api.get<User[]>(`/api/users/${userId}/followers`);
    return response.data;
  },

  getFollowing: async (userId: number): Promise<User[]> => {
    const response = await api.get<User[]>(`/api/users/${userId}/following`);
    return response.data;
  },
};
