import api from './api';
import { Comment, Post } from '@/types';

export type { Comment, Post } from '@/types';

export interface CreatePostRequest {
  userId: number;
  content: string;
  mediaIds: number[];
  visibility?: Post['visibility'];
}

export interface UpdatePostRequest {
  userId: number;
  content?: string;
  mediaUrls?: string[];
  visibility: Post['visibility'];
}

interface PostCommandResponse {
  postId: number;
  message: string;
}

interface PostDetailResponse {
  postId: number;
  userId: number;
  content: string;
  visibility: Post['visibility'];
  mediaUrls?: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

interface CommentResponse {
  commentId: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
}

interface CommentPageResponse {
  items: CommentResponse[];
  metadata: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  };
}

export interface FeedResponse {
  items: Post[];
  nextCursor: string | null;
  hasNext: boolean;
}

const mapPost = (post: PostDetailResponse): Post => ({
  id: post.postId,
  userId: post.userId,
  content: post.content,
  mediaUrls: post.mediaUrls ?? [],
  likeCount: post.likeCount,
  commentCount: post.commentCount,
  shareCount: 0,
  visibility: post.visibility,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  author: {
    id: post.userId,
    username: `user${post.userId}`,
    email: '',
    fullName: `User ${post.userId}`,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  },
});

const mapComment = (comment: CommentResponse): Comment => ({
  id: comment.commentId,
  postId: comment.postId,
  userId: comment.userId,
  content: comment.content,
  likeCount: 0,
  createdAt: comment.createdAt,
  author: {
    id: comment.userId,
    username: `user${comment.userId}`,
    email: '',
    fullName: `User ${comment.userId}`,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt: comment.createdAt,
    updatedAt: comment.createdAt,
  },
});

export const postService = {
  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post<PostCommandResponse>('/api/v1/posts', data, {
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
      },
    });

    try {
      return await postService.getPostDetail(response.data.postId);
    } catch {
      const createdAt = new Date().toISOString();

      return {
        id: response.data.postId,
        userId: data.userId,
        content: data.content,
        mediaUrls: [],
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        visibility: data.visibility ?? 'PUBLIC',
        createdAt,
        updatedAt: createdAt,
        author: {
          id: data.userId,
          username: `user${data.userId}`,
          email: '',
          fullName: `User ${data.userId}`,
          followerCount: 0,
          followingCount: 0,
          postCount: 0,
          createdAt,
          updatedAt: createdAt,
        },
      };
    }
  },

  getFeed: async (userId: number, limit = 20, cursor?: string): Promise<FeedResponse> => {
    const response = await api.get<{ items: PostDetailResponse[]; nextCursor: string | null; hasNext: boolean }>(
      `/api/v1/posts/feed/${userId}`,
      {
        params: { size: limit, cursor },
      }
    );

    return {
      ...response.data,
      items: response.data.items.map(mapPost),
    };
  },

  getPostDetail: async (postId: number): Promise<Post> => {
    const response = await api.get<PostDetailResponse>(`/api/v1/posts/${postId}`);
    return mapPost(response.data);
  },

  getPostById: async (postId: number): Promise<Post> => {
    const response = await api.get<PostDetailResponse>(`/api/v1/posts/${postId}`);
    return mapPost(response.data);
  },

  updatePost: async (postId: number, data: UpdatePostRequest): Promise<Post> => {
    await api.put<PostCommandResponse>(`/api/v1/posts/${postId}`, data);
    return postService.getPostDetail(postId);
  },

  deletePost: async (postId: number, userId: number): Promise<void> => {
    await api.delete(`/api/v1/posts/${postId}`, {
      params: { userId },
    });
  },

  likePost: async (postId: number, userId: number): Promise<void> => {
    await api.post(`/api/v1/posts/${postId}/like`, { userId });
  },

  unlikePost: async (postId: number, userId: number): Promise<void> => {
    await api.delete(`/api/v1/posts/${postId}/like`, {
      params: { userId },
    });
  },

  getComments: async (postId: number, page = 0, size = 20): Promise<Comment[]> => {
    const response = await api.get<CommentPageResponse>(`/api/v1/posts/${postId}/comments`, {
      params: { page, size },
    });

    return response.data.items.map(mapComment);
  },

  createComment: async (postId: number, userId: number, content: string): Promise<Comment> => {
    const response = await api.post<{ postId: number; commentId: number; commentCount: number }>(
      `/api/v1/posts/${postId}/comments`,
      { userId, content }
    );

    const createdAt = new Date().toISOString();

    return mapComment({
      commentId: response.data.commentId,
      postId: response.data.postId,
      userId,
      content,
      createdAt,
    });
  },

  getUserPosts: async (userId: number): Promise<Post[]> => {
    const response = await postService.getFeed(userId);
    return response.items;
  },
};
