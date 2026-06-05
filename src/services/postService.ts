import api from './api';
import axios from 'axios';
import { Comment, Post } from '@/types';

export type { Comment, Post } from '@/types';

export interface CreatePostRequest {
  userId: number;
  content: string;
  mediaIds: number[];
  visibility?: Post['visibility'];
}

export interface FeedResponse {
  items: Post[];
  nextCursor: string | null;
  hasNext: boolean;
}

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

const getAccessToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

export const postService = {
  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const token = getAccessToken();

    if (!token) {
      throw new Error('Token missing or expired. Please log in again.');
    }

    const response = await axios.post<Post>(`${API_GATEWAY_URL}/api/v1/posts`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
    });

    return response.data;
  },

  getFeed: async (userId: number, limit = 20, cursor?: string): Promise<FeedResponse> => {
    const response = await api.get<FeedResponse>(`/v1/feed/${userId}`, {
      params: { limit, cursor },
    });
    return response.data;
  },

  getPostDetail: async (postId: number): Promise<Post> => {
    const response = await api.get<Post>(`/v1/posts/${postId}`);
    return response.data;
  },

  getPostById: async (postId: number): Promise<Post> => {
    const response = await api.get<Post>(`/v1/posts/${postId}`);
    return response.data;
  },

  updatePost: async (postId: number, data: Partial<Post>): Promise<Post> => {
    const response = await api.put<Post>(`/v1/posts/${postId}`, data);
    return response.data;
  },

  deletePost: async (postId: number, userId?: number): Promise<void> => {
    await api.delete(`/v1/posts/${postId}`, {
      params: userId ? { userId } : undefined,
    });
  },

  likePost: async (postId: number, userId?: number): Promise<void> => {
    await api.post(`/v1/posts/${postId}/like`, userId ? { userId } : {});
  },

  unlikePost: async (postId: number, userId?: number): Promise<void> => {
    await api.post(`/v1/posts/${postId}/unlike`, userId ? { userId } : {});
  },

  getComments: async (postId: number): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/v1/posts/${postId}/comments`);
    return response.data;
  },

  createComment: async (postId: number, content: string): Promise<Comment> => {
    const response = await api.post<Comment>(`/v1/posts/${postId}/comments`, { content });
    return response.data;
  },

  getUserPosts: async (userId: number): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/v1/users/${userId}/posts`);
    return response.data;
  },
};
