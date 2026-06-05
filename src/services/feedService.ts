import axios from 'axios';
import api from './api';
import { Post } from '@/types';

export interface FeedResponse {
  items: Post[];
  nextCursor: string | null;
  hasNext: boolean;
}

export const feedService = {
  getFeed: async (userId: number, limit = 20, cursor?: string): Promise<FeedResponse> => {
    const response = await axios.get<FeedResponse>(`http://localhost:8084/api/v1/feed/${userId}`, {
      params: { limit, cursor },
    });
    return response.data;
  },

  getExploreFeed: async (limit = 20, cursor?: string): Promise<FeedResponse> => {
    const response = await axios.get<FeedResponse>('http://localhost:8084/api/v1/feed/explore', {
      params: { limit, cursor },
    });
    return response.data;
  },
};
