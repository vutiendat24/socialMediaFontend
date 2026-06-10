/**
 * API routes — all requests go through API Gateway (port 8080).
 *
 * | Path prefix           | Service              |
 * |-----------------------|----------------------|
 * | /auth/*               | user-service         |
 * | /api/users/*          | user-service         |
 * | /api/posts/*          | post-service         |
 * | /api/feed/*           | post-service (feed)  |
 * | /api/media/*          | media-service        |
 * | /api/notifications/*  | notification-service |
 * | /api/conversations/*  | chat-service         |
 * | /api/search/*         | search-service       |
 */

export const API_ROUTES = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  users: {
    profile: (id: number) => `/api/users/${id}/profile`,
    follow: (id: number) => `/api/users/${id}/follow`,
    followers: (id: number) => `/api/users/${id}/followers`,
    following: (id: number) => `/api/users/${id}/following`,
    search: '/api/users/search',
  },
  posts: {
    base: '/api/posts',
    detail: (id: string | number) => `/api/posts/${id}`,
    feed: (userId: number) => `/api/feed/${userId}`,
    comments: (id: string | number) => `/api/posts/${id}/comments`,
    like: (id: string | number) => `/api/posts/${id}/like`,
  },
  media: {
    presignedUrl: '/api/media/presigned-url',
    upload: '/api/media/upload',
    detail: (id: number) => `/api/media/${id}`,
  },
  notifications: {
    base: '/api/notifications',
    read: (id: string | number) => `/api/notifications/${id}/read`,
  },
  chat: {
    conversations: '/api/conversations',
    messages: (id: string) => `/api/conversations/${id}/messages`,
  },
  search: {
    all: '/api/search',
    users: '/api/search/users',
    posts: '/api/search/posts',
  },
} as const;
