import api from './api';
import { Post, User } from '@/types';

export interface SearchResultItem {
  id: number;
  type: 'USER' | 'POST';
  content?: string;
  author?: {
    id: number;
    username: string;
    fullName: string;
  };
  tags?: string[];
  likesCount?: number;
  username?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  followerCount?: number;
  createdAt?: string;
  score?: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

const mapUserResult = (item: SearchResultItem): User => ({
  id: item.id,
  username: item.username ?? '',
  email: '',
  fullName: item.fullName ?? item.username ?? '',
  bio: item.bio,
  avatar: item.avatarUrl,
  followerCount: item.followerCount ?? 0,
  followingCount: 0,
  postCount: 0,
  createdAt: item.createdAt ?? '',
  updatedAt: item.createdAt ?? '',
});

const mapPostResult = (item: SearchResultItem): Post => ({
  id: item.id,
  userId: item.author?.id ?? 0,
  content: item.content ?? '',
  likeCount: item.likesCount ?? 0,
  commentCount: 0,
  shareCount: 0,
  visibility: 'PUBLIC',
  createdAt: item.createdAt ?? '',
  updatedAt: item.createdAt ?? '',
  author: {
    id: item.author?.id ?? 0,
    username: item.author?.username ?? '',
    email: '',
    fullName: item.author?.fullName ?? '',
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt: '',
    updatedAt: '',
  },
});

export const searchService = {
  searchUsers: async (query: string, page = 0, size = 10): Promise<User[]> => {
    try {
      const response = await api.get<SearchResponse>('/api/search/users', {
        params: { q: query, page, size },
      });
      return (response.data.results ?? [])
        .filter((item) => item.type === 'USER' || item.username)
        .map(mapUserResult);
    } catch {
      // Fallback: gọi thẳng user-service (userServiceCB riêng biệt)
      try {
        const fallback = await api.get<{ items: Array<{
          id: number;
          username: string;
          fullName: string;
          bio?: string;
          avatar?: string;
          followerCount?: number;
          createdAt?: string;
        }> }>('/api/users/search', {
          params: { q: query, page, size },
        });
        return (fallback.data.items ?? []).map((item) => ({
          id: item.id,
          username: item.username,
          email: '',
          fullName: item.fullName,
          bio: item.bio,
          avatar: item.avatar,
          followerCount: item.followerCount ?? 0,
          followingCount: 0,
          postCount: 0,
          createdAt: item.createdAt ?? '',
          updatedAt: item.createdAt ?? '',
        }));
      } catch {
        return [];
      }
    }
  },

  searchPosts: async (query: string, page = 0, size = 10): Promise<Post[]> => {
    try {
      const response = await api.get<SearchResponse>('/api/search/posts', {
        params: { q: query, page, size },
      });
      return (response.data.results ?? [])
        .filter((item) => item.type === 'POST' || item.content)
        .map(mapPostResult);
    } catch {
      // search-service không khả dụng, trả về rỗng (không cascade lỗi)
      return [];
    }
  },

  searchAll: async (
    query: string,
    page = 0,
    size = 10
  ): Promise<{ users: User[]; posts: Post[] }> => {
    // Thử gọi endpoint tổng hợp trước
    try {
      const response = await api.get<SearchResponse>('/api/search', {
        params: { q: query, page, size },
      });
      const results = response.data.results ?? [];

      // Nếu có kết quả thì phân loại và trả về
      if (results.length > 0) {
        const users: User[] = [];
        const posts: Post[] = [];

        for (const item of results) {
          if (item.type === 'USER' || (item.username && !item.content)) {
            users.push(mapUserResult(item));
          } else {
            posts.push(mapPostResult(item));
          }
        }

        return { users, posts };
      }
    } catch {
      // search-service không khả dụng, chuyển sang fallback
    }

    // ──────────────────────────────────────────────────────────────
    // FALLBACK: bypass /api/search/* hoàn toàn để tránh circuit
    // breaker searchServiceCB tiếp tục đếm lỗi và ảnh hưởng
    // các chức năng khác. Gọi thẳng user-service & post-service.
    // ──────────────────────────────────────────────────────────────
    const [usersResult, postsResult] = await Promise.allSettled([
      // Gọi user-service trực tiếp (route /api/users/**, userServiceCB)
      api.get<{ items: Array<{
        id: number;
        username: string;
        fullName: string;
        bio?: string;
        avatar?: string;
        followerCount?: number;
        createdAt?: string;
      }> }>('/api/users/search', {
        params: { q: query, page, size },
      }),
      // Gọi post-service trực tiếp (route /api/posts/**, postServiceCB)
      api.get<{ content: Array<{
        id: number;
        userId: number;
        content: string;
        likeCount?: number;
        commentCount?: number;
        shareCount?: number;
        visibility?: string;
        createdAt?: string;
        updatedAt?: string;
        author?: {
          id: number;
          username: string;
          fullName: string;
        };
      }> }>('/api/posts/search', {
        params: { q: query, page, size },
      }),
    ]);

    const mappedUsers: User[] =
      usersResult.status === 'fulfilled'
        ? (usersResult.value.data.items ?? []).map((u) => ({
            id: u.id,
            username: u.username,
            email: '',
            fullName: u.fullName,
            bio: u.bio,
            avatar: u.avatar,
            followerCount: u.followerCount ?? 0,
            followingCount: 0,
            postCount: 0,
            createdAt: u.createdAt ?? '',
            updatedAt: u.createdAt ?? '',
          }))
        : [];

    const mappedPosts: Post[] =
      postsResult.status === 'fulfilled'
        ? (postsResult.value.data.content ?? [])
            .filter((p) =>
              p.content?.toLowerCase().includes(query.toLowerCase())
            )
            .map((p) => ({
              id: p.id,
              userId: p.userId,
              content: p.content,
              likeCount: p.likeCount ?? 0,
              commentCount: p.commentCount ?? 0,
              shareCount: p.shareCount ?? 0,
              visibility:
                (p.visibility as 'PUBLIC' | 'PRIVATE' | 'FRIENDS' | 'FRIENDS_ONLY') ??
                'PUBLIC',
              createdAt: p.createdAt ?? '',
              updatedAt: p.updatedAt ?? '',
              author: {
                id: p.author?.id ?? 0,
                username: p.author?.username ?? '',
                email: '',
                fullName: p.author?.fullName ?? '',
                followerCount: 0,
                followingCount: 0,
                postCount: 0,
                createdAt: '',
                updatedAt: '',
              },
            }))
        : [];

    return { users: mappedUsers, posts: mappedPosts };
  },
};
