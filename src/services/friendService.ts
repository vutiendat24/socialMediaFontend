import api from './api';
import { API_ROUTES } from './apiRoutes';
import { FriendRequest, FriendshipStatusResponse, PageResponse, User } from '@/types';

export const friendService = {
  sendFriendRequest: async (userId: number): Promise<FriendRequest> => {
    const response = await api.post<FriendRequest>(API_ROUTES.users.sendFriendRequest(userId));
    return response.data;
  },

  cancelFriendRequest: async (userId: number): Promise<void> => {
    await api.delete(API_ROUTES.users.cancelFriendRequest(userId));
  },

  acceptFriendRequest: async (requestId: number): Promise<FriendRequest> => {
    const response = await api.post<FriendRequest>(API_ROUTES.users.acceptFriendRequest(requestId));
    return response.data;
  },

  rejectFriendRequest: async (requestId: number): Promise<FriendRequest> => {
    const response = await api.post<FriendRequest>(API_ROUTES.users.rejectFriendRequest(requestId));
    return response.data;
  },

  getIncomingRequests: async (page = 0, size = 20): Promise<PageResponse<FriendRequest>> => {
    const response = await api.get<PageResponse<FriendRequest>>(API_ROUTES.users.incomingFriendRequests, {
      params: { page, size },
    });
    return response.data;
  },

  getOutgoingRequests: async (page = 0, size = 20): Promise<PageResponse<FriendRequest>> => {
    const response = await api.get<PageResponse<FriendRequest>>(API_ROUTES.users.outgoingFriendRequests, {
      params: { page, size },
    });
    return response.data;
  },

  getFriends: async (userId: number, page = 0, size = 20): Promise<PageResponse<User>> => {
    const response = await api.get<PageResponse<User>>(API_ROUTES.users.friends(userId), {
      params: { page, size },
    });
    return response.data;
  },

  unfriend: async (userId: number): Promise<void> => {
    await api.delete(API_ROUTES.users.friends(userId));
  },

  getFriendshipStatus: async (userId: number): Promise<FriendshipStatusResponse> => {
    const response = await api.get<FriendshipStatusResponse>(API_ROUTES.users.friendshipStatus(userId));
    return response.data;
  },
};
