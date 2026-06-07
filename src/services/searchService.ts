import api from './api';
import { Post, User } from '@/types';

export const searchService = {
  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get<User[]>('/api/search/users', {
      params: { q: query },
    });
    return response.data;
  },

  searchPosts: async (query: string): Promise<Post[]> => {
    const response = await api.get<Post[]>('/api/search/posts', {
      params: { q: query },
    });
    return response.data;
  },

  searchHashtags: async (query: string): Promise<string[]> => {
    const response = await api.get<string[]>('/api/search', {
      params: { q: query },
    });
    return response.data;
  },
};
