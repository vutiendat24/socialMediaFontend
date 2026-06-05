// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowed?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Post Types
export interface Post {
  id: number;
  userId: number;
  content: string;
  mediaUrls?: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked?: boolean;
  visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'FRIENDS_ONLY';
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  likeCount: number;
  isLiked?: boolean;
  createdAt: string;
  author: User;
}

// Notification Types
export interface Notification {
  id: number;
  userId: number;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MESSAGE';
  relatedUserId: number;
  relatedPostId?: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedUser: User;
}

// Media Types
export interface MediaUpload {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  size: number;
  uploadedAt: string;
}

// Feed Types
export interface FeedItem {
  post: Post;
  isPinned?: boolean;
}

// Search Types
export interface SearchResult {
  users: User[];
  posts: Post[];
  hashtags: string[];
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
