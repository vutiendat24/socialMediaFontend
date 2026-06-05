import useSWR, { mutate } from 'swr';
import { authService, User } from '@/services/authService';
import { useCallback } from 'react';

export const useUserProfile = (userId: number) => {
  const { data: user, isLoading, error } = useSWR(
    userId ? `/users/${userId}` : null,
    () => authService.getUserProfile(userId),
    {
      revalidateOnFocus: false,
    }
  );

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      try {
        const updated = await authService.updateUserProfile(userId, data);
        mutate(`/users/${userId}`);
        return updated;
      } catch (error) {
        throw error;
      }
    },
    [userId]
  );

  const follow = useCallback(
    async (currentUserId: number) => {
      try {
        await authService.followUser(currentUserId, userId);
        mutate(`/users/${userId}`);
      } catch (error) {
        throw error;
      }
    },
    [userId]
  );

  const unfollow = useCallback(
    async (currentUserId: number) => {
      try {
        await authService.unfollowUser(currentUserId, userId);
        mutate(`/users/${userId}`);
      } catch (error) {
        throw error;
      }
    },
    [userId]
  );

  return {
    user,
    isLoading,
    error,
    updateProfile,
    follow,
    unfollow,
  };
};

export const useUserFollowers = (userId: number) => {
  const { data: followers = [], isLoading, error } = useSWR(
    userId ? `/users/${userId}/followers` : null,
    () => authService.getFollowers(userId)
  );

  return { followers, isLoading, error };
};

export const useUserFollowing = (userId: number) => {
  const { data: following = [], isLoading, error } = useSWR(
    userId ? `/users/${userId}/following` : null,
    () => authService.getFollowing(userId)
  );

  return { following, isLoading, error };
};
