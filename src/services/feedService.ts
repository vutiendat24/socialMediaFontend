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
  getHealth: async (): Promise<FeedHealthResponse> => {
    const response = await api.get<FeedHealthResponse>('/api/feed');
    return response.data;
  },

  getFeed: async (userId: number, limit = 20, cursor?: string): Promise<FeedResponse> => {
    return postService.getFeed(userId, limit, cursor);
  },

  getExploreFeed: async (limit = 20, cursor?: string): Promise<FeedResponse> => {
    return postService.getFeed(0, limit, cursor);
  },
};
