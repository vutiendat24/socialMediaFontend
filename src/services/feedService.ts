import api from './api';
import { Post } from '@/types';

export interface FeedResponse {
  items: Post[];
  nextCursor: string | null;
  hasNext: boolean;
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
