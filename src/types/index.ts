// User Types
export type EntityId = string | number;

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

export interface PageResponse<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export type FriendshipStatus = 'NONE' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'FRIENDS';

export interface FriendRequest {
  id: number;
  requesterId: number;
  receiverId: number;
  status: FriendRequestStatus;
  requester?: User;
  receiver?: User;
  createdAt: string;
  updatedAt: string;
}

export interface FriendshipStatusResponse {
  status: FriendshipStatus;
  requestId?: number;
}

// Post Types
export interface Post {
  id: EntityId;
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
  id: EntityId;
  postId: EntityId;
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
  relatedPostId?: EntityId;
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
