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
    const response = await api.post<LoginResponse>('/auth/refresh-token');
    saveAuth(response.data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/users/login', data);
    saveAuth(response.data);
    return response.data;
  },

  loginWithGoogle: async (idToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/google', { idToken });
    saveAuth(response.data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout').catch(() => undefined);
    clearAuth();
  },

  register: async (payload: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/users/register', payload);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  getUserProfile: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  },

  updateUserProfile: async (
    userId: number,
    data: Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'followerCount' | 'followingCount'>>
  ): Promise<User> => {
    const response = await api.put<User>(`/users/${userId}`, data);
    return response.data;
  },

  followUser: async (followerId: number, followingId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/users/${followerId}/follow/${followingId}`);
    return response.data;
  },

  unfollowUser: async (followerId: number, followingId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/users/${followerId}/follow/${followingId}`);
    return response.data;
  },

  getFollowers: async (userId: number): Promise<User[]> => {
    const response = await api.get<User[]>(`/users/${userId}/followers`);
    return response.data;
  },

  getFollowing: async (userId: number): Promise<User[]> => {
    const response = await api.get<User[]>(`/users/${userId}/following`);
    return response.data;
  },

  getStoredUser: (): User | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 5,
        username: 'john_doe',
        email: 'john@example.com',
        fullName: 'John Doe',
        bio: 'Photographer & Adventurer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop',
        followerCount: 456,
        followingCount: 234,
        postCount: 67,
        createdAt: '2023-03-12T10:00:00Z',
        updatedAt: '2024-06-04T10:00:00Z',
      })
    );
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: (): boolean => {
    return typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
  },
};
