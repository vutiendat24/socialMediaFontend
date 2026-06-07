import { Post } from '@/types';
import { postService } from './postService';
import api from './api';

export interface FeedResponse {
  items: Post[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface FeedHealthResponse {
  service: string;
  port: number;
  status: string;
}

export const feedService = {
  getFeed: async (userId: number, limit = 20, cursor?: string): Promise<FeedResponse> => {
    const response = await api.get<FeedResponse>(`/api/feed/${userId}`, {
      params: { size: limit, cursor },
    });
    return response.data;
  },

  getExploreFeed: async (limit = 20, cursor?: string): Promise<FeedResponse> => {
    const response = await api.get<FeedResponse>(`/api/search`, {
      params: { q: '', size: limit, cursor },
    });
    return response.data;
  },
};
