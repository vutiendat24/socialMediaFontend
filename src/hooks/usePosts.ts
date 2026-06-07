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
        await postService.deletePost(postId);
        mutate(getFeedKey(feedUserId));
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const likePost = useCallback(
    async (postId: number) => {
      try {
        return await postService.likePost(postId);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const unlikePost = useCallback(
    async (postId: number) => {
      try {
        return await postService.unlikePost(postId);
      } catch (error) {
        throw error;
      }
    },
    []
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
