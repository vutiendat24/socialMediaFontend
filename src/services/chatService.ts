import api from './api';

export interface Conversation {
  id: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export const chatService = {
  getConversations: async (userId: string): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/api/conversations', {
      params: { userId },
    });
    return response.data;
  },

  createConversation: async (conversation: Partial<Conversation>): Promise<Conversation> => {
    const response = await api.post<Conversation>('/api/conversations', conversation);
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>(`/api/conversations/${conversationId}/messages`);
    return response.data;
  },
};
