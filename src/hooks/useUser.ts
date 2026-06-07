import useSWR, { mutate } from 'swr';
import { authService, User } from '@/services/authService';
import { useCallback } from 'react';

export const useUserProfile = (userId: number) => {
  const { data: user, isLoading, error } = useSWR(
    userId ? `/api/users/${userId}/profile` : null,
    () => authService.getUserProfile(userId),
    {
      revalidateOnFocus: false,
    }
  );

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      const updated = await authService.updateUserProfile(userId, data);
      mutate(`/api/users/${userId}/profile`);
      return updated;
    },
    [userId]
  );

  const follow = useCallback(async () => {
    await authService.followUser(userId);
    mutate(`/api/users/${userId}/profile`);
  }, [userId]);

  const unfollow = useCallback(async () => {
    await authService.unfollowUser(userId);
    mutate(`/api/users/${userId}/profile`);
  }, [userId]);

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
    userId ? `/api/users/${userId}/followers` : null,
    () => authService.getFollowers(userId)
  );

  return { followers, isLoading, error };
};

export const useUserFollowing = (userId: number) => {
  const { data: following = [], isLoading, error } = useSWR(
    userId ? `/api/users/${userId}/following` : null,
    () => authService.getFollowing(userId)
  );

  return { following, isLoading, error };
};
