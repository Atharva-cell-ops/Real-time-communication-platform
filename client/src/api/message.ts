import { apiClient } from './client';
import { Message } from '../types';

export const messageApi = {
  getMeetingMessages: async (meetingId: string): Promise<{ success: boolean; data: Message[] }> => {
    const res = await apiClient.get<{ success: boolean; data: Message[] }>(`/messages/${meetingId}`);
    return res.data;
  },

  sendMessage: async (
    meetingId: string,
    content: string,
    fileId?: string
  ): Promise<{ success: boolean; data: Message }> => {
    const res = await apiClient.post<{ success: boolean; data: Message }>(`/messages/${meetingId}`, {
      content,
      fileId,
    });
    return res.data;
  },
};
