import api from './api';
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

export const postService = {
  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post<Post>(`/api/posts`, data, {
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
      },
    });
    return response.data;
  },

  getFeed: async (userId: number, limit = 20, cursor?: string): Promise<FeedResponse> => {
    const response = await api.get<FeedResponse>(`/api/feed/${userId}`, {
      params: { size: limit, cursor },
    });
    return response.data;
  },

  getPostDetail: async (postId: number): Promise<Post> => {
    const response = await api.get<Post>(`/api/posts/${postId}`);
    return response.data;
  },

  getPostById: async (postId: number): Promise<Post> => {
    const response = await api.get<Post>(`/api/posts/${postId}`);
    return response.data;
  },

  updatePost: async (postId: number, data: Partial<Post>): Promise<Post> => {
    const response = await api.put<Post>(`/api/posts/${postId}`, data);
    return response.data;
  },

  deletePost: async (postId: number): Promise<void> => {
    await api.delete(`/api/posts/${postId}`);
  },

  likePost: async (postId: number): Promise<void> => {
    await api.post(`/api/posts/${postId}/like`);
  },

  unlikePost: async (postId: number): Promise<void> => {
    await api.delete(`/api/posts/${postId}/like`);
  },

  getComments: async (postId: number, page: number = 0, size: number = 20): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/api/posts/${postId}/comments`, {
      params: { page, size },
    });
    return response.data;
  },

  createComment: async (postId: number, content: string): Promise<Comment> => {
    const response = await api.post<Comment>(`/api/posts/${postId}/comments`, { content });
    return response.data;
  },
};
