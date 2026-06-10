import api from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  bio: string | null;
  avatar: string | null;
  coverImage: string | null;
  followerCount: number;
  followingCount: number;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

const saveAuth = (response: LoginResponse) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('accessToken', response.accessToken);
  localStorage.setItem('refreshToken', response.refreshToken);
  localStorage.setItem('currentUser', JSON.stringify(response.user));
};

const clearAuth = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');
};

export const authService = {
  refreshToken: async (): Promise<LoginResponse> => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refreshToken) {
      throw new Error('Khong tim thay refresh token');
    }

    const response = await api.post<LoginResponse>('/auth/refresh', { refreshToken });
    saveAuth(response.data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    // Get from localStorage since backend doesn't have /users/me endpoint
    const stored = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    if (stored) {
      return JSON.parse(stored);
    }
    throw new Error('No user logged in');
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('api/users/login', data);
    saveAuth(response.data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
    clearAuth();
  },

  register: async (payload: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/api/users/register', payload);
    return response.data;
  },

  getUserProfile: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/api/users/${userId}/profile`);
    return response.data;
  },

  updateUserProfile: async (
    userId: number,
    data: Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'followerCount' | 'followingCount'>>
  ): Promise<User> => {
    const response = await api.put<User>(`/api/users/${userId}/profile`, data);
    return response.data;
  },

  followUser: async (targetUserId: number): Promise<{ message: string; targetUserId: number }> => {
    const response = await api.post<{ message: string; targetUserId: number }>(`/api/users/${targetUserId}/follow`);
    return response.data;
  },

  unfollowUser: async (targetUserId: number): Promise<{ message: string; targetUserId: number }> => {
    const response = await api.delete<{ message: string; targetUserId: number }>(`/api/users/${targetUserId}/follow`);
    return response.data;
  },

  getFollowers: async (userId: number, page: number = 0, size: number = 10): Promise<User[]> => {
    const response = await api.get<{ items: User[] }>(`/api/users/${userId}/followers`, {
      params: { page, size },
    });
    return response.data.items ?? [];
  },

  getFollowing: async (userId: number, page: number = 0, size: number = 10): Promise<User[]> => {
    const response = await api.get<{ items: User[] }>(`/api/users/${userId}/following`, {
      params: { page, size },
    });
    return response.data.items ?? [];
  },

  getStoredUser: (): User | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    const user = localStorage.getItem('currentUser');
    console.log(user);
    return user ? JSON.parse(user) : null;
  },

  updateStoredUser: (user: User): void => {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
  },

  isAuthenticated: (): boolean => {
    return typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
  },
};
