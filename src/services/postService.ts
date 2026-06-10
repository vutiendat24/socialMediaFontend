import api from './api';
import { mediaService } from './mediaService';
import { Comment, Post, User } from '@/types';

export type { Comment, Post } from '@/types';

export interface CreatePostRequest {
  userId: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  content: string;
  mediaIds: number[];
  media?: CreatePostMediaRequest[];
  visibility?: Post['visibility'];
}

export interface CreatePostMediaRequest {
  mediaId: number;
  mediaUrl: string;
  fileType?: string;
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
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  content: string;
  visibility: Post['visibility'];
  mediaUrls?: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

interface CommentResponse {
  commentId: number;
  postId: number;
  userId: number;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
}

export interface LikeActionResponse {
  postId: number;
  userId: number;
  likeCount: number;
  liked: boolean;
}

interface CommentCommandResponse {
  postId: number;
  commentId: number;
  userId: number;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  content: string;
  commentCount: number;
}

export interface CreateCommentResult {
  comment: Comment;
  commentCount: number;
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

type StoredAuthor = Partial<User> & { id?: number };

const getStoredAuthor = (userId: number): StoredAuthor | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedUser = localStorage.getItem('currentUser');
  if (!storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser) as StoredAuthor;
    return user.id === userId ? user : null;
  } catch {
    return null;
  }
};

const mapAuthor = (
  userId: number,
  createdAt: string,
  updatedAt = createdAt,
  author?: { username?: string | null; displayName?: string | null; avatarUrl?: string | null }
): User => {
  const storedAuthor = getStoredAuthor(userId);
  const username = author?.username ?? storedAuthor?.username ?? `user${userId}`;
  const fullName = author?.displayName || storedAuthor?.fullName || username || `User ${userId}`;
  const avatar = author?.avatarUrl ?? storedAuthor?.avatar;

  if (storedAuthor) {
    return {
      id: userId,
      username,
      email: storedAuthor.email ?? '',
      fullName,
      bio: storedAuthor.bio,
      avatar,
      coverImage: storedAuthor.coverImage,
      followerCount: storedAuthor.followerCount ?? 0,
      followingCount: storedAuthor.followingCount ?? 0,
      postCount: storedAuthor.postCount ?? 0,
      createdAt: storedAuthor.createdAt ?? createdAt,
      updatedAt: storedAuthor.updatedAt ?? updatedAt,
    };
  }

  return {
    id: userId,
    username,
    email: '',
    fullName,
    avatar: avatar ?? undefined,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt,
    updatedAt,
  };
};

const mapPost = (post: PostDetailResponse): Post => ({
  id: post.postId,
  userId: post.userId,
  content: post.content,
  mediaUrls: post.mediaUrls ?? [],
  likeCount: post.likeCount,
  commentCount: post.commentCount,
  shareCount: 0,
  isLiked: post.liked ?? false,
  visibility: post.visibility,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  author: mapAuthor(post.userId, post.createdAt, post.updatedAt, {
    username: post.username,
    displayName: post.displayName,
    avatarUrl: post.avatarUrl,
  }),
});

const mapComment = (comment: CommentResponse): Comment => ({
  id: comment.commentId,
  postId: comment.postId,
  userId: comment.userId,
  content: comment.content,
  likeCount: 0,
  createdAt: comment.createdAt,
  author: mapAuthor(comment.userId, comment.createdAt, comment.createdAt, {
    username: comment.username,
    displayName: comment.displayName,
    avatarUrl: comment.avatarUrl,
  }),
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
        mediaUrls: data.media?.map((media) => media.mediaUrl) ?? data.mediaIds.map(mediaService.getMediaUrl),
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        visibility: data.visibility ?? 'PUBLIC',
        createdAt,
        updatedAt: createdAt,
        author: mapAuthor(data.userId, createdAt, createdAt, {
          username: data.username,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
        }),
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

  likePost: async (postId: number, userId: number): Promise<LikeActionResponse> => {
    const response = await api.post<LikeActionResponse>(`/api/v1/posts/${postId}/like`, { userId });
    return response.data;
  },

  unlikePost: async (postId: number, userId: number): Promise<LikeActionResponse> => {
    const response = await api.delete<LikeActionResponse>(`/api/v1/posts/${postId}/like`, {
      params: { userId },
    });
    return response.data;
  },

  getComments: async (postId: number, page = 0, size = 20): Promise<Comment[]> => {
    const response = await api.get<CommentPageResponse>(`/api/v1/posts/${postId}/comments`, {
      params: { page, size },
    });

    return response.data.items.map(mapComment);
  },

  createComment: async (postId: number, user: User, content: string): Promise<CreateCommentResult> => {
    const createdAt = new Date().toISOString();
    const response = await api.post<CommentCommandResponse>(`/api/v1/posts/${postId}/comments`, {
      userId: user.id,
      username: user.username,
      displayName: user.fullName,
      avatarUrl: user.avatar,
      content,
    });

    const comment = mapComment({
      commentId: response.data.commentId,
      postId: response.data.postId,
      userId: response.data.userId,
      username: response.data.username ?? user.username,
      displayName: response.data.displayName ?? user.fullName,
      avatarUrl: response.data.avatarUrl ?? user.avatar,
      content: response.data.content ?? content,
      createdAt,
    });

    return {
      comment,
      commentCount: response.data.commentCount,
    };
  },

  getUserPosts: async (userId: number): Promise<Post[]> => {
    const response = await postService.getFeed(userId);
    return response.items;
  },
};
