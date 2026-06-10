import useSWR, { mutate } from 'swr';
import { postService, Post, CreatePostRequest } from '@/services/postService';
import { useCallback } from 'react';

const getFeedKey = (userId: number) => ['posts', 'feed', userId] as const;
const getPostKey = (postId: number) => ['posts', 'detail', postId] as const;

export const usePosts = (userId?: number) => {
  const feedKey = userId ? getFeedKey(userId) : null;
  const { data: posts = [], isLoading, error } = useSWR(
    feedKey,
    ([, , feedUserId]) => postService.getFeed(feedUserId).then((data) => data.items),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const createPost = useCallback(
    async (data: CreatePostRequest) => {
      try {
        const result = await postService.createPost(data);
        // Revalidate feed
        if (userId) {
          mutate(getFeedKey(userId));
        }
        return result;
      } catch (error) {
        throw error;
      }
    },
    [userId]
  );

  const deletePost = useCallback(
    async (postId: number, feedUserId: number) => {
      try {
        if (!userId) {
          throw new Error('User id is required to delete a post');
        }

        await postService.deletePost(postId, userId);
        mutate(getFeedKey(feedUserId));
      } catch (error) {
        throw error;
      }
    },
    [userId]
  );

  const likePost = useCallback(
    async (postId: number) => {
      try {
        if (!userId) {
          throw new Error('User id is required to like a post');
        }

        return await postService.likePost(postId, userId);
      } catch (error) {
        throw error;
      }
    },
    [userId]
  );

  const unlikePost = useCallback(
    async (postId: number) => {
      try {
        if (!userId) {
          throw new Error('User id is required to unlike a post');
        }

        return await postService.unlikePost(postId, userId);
      } catch (error) {
        throw error;
      }
    },
    [userId]
  );

  return {
    posts,
    isLoading,
    error,
    createPost,
    deletePost,
    likePost,
    unlikePost,
  };
};

export const usePostDetail = (postId: number) => {
  const { data: post, isLoading, error } = useSWR(
    postId ? getPostKey(postId) : null,
    () => postService.getPostDetail(postId),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    post,
    isLoading,
    error,
  };
};
