import { apiClient } from './client';
import { Meeting } from '../types';

export interface CreateMeetingDTO {
  title: string;
  description?: string;
  passcode?: string;
  isLocked?: boolean;
}

export interface UserMeetingsResponse {
  success: boolean;
  data: {
    hosted: Meeting[];
    attended: Meeting[];
  };
}

export const meetingApi = {
  createMeeting: async (data: CreateMeetingDTO): Promise<{ success: boolean; data: Meeting }> => {
    const res = await apiClient.post<{ success: boolean; data: Meeting }>('/meetings', data);
    return res.data;
  },

  getMeeting: async (identifier: string): Promise<{ success: boolean; data: Meeting }> => {
    const res = await apiClient.get<{ success: boolean; data: Meeting }>(`/meetings/${identifier}`);
    return res.data;
  },

  joinMeeting: async (
    identifier: string,
    passcode?: string
  ): Promise<{ success: boolean; message: string; data: Meeting }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Meeting }>(
      `/meetings/${identifier}/join`,
      { passcode }
    );
    return res.data;
  },

  leaveMeeting: async (identifier: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>(`/meetings/${identifier}/leave`);
    return res.data;
  },

  getUserMeetings: async (): Promise<UserMeetingsResponse> => {
    const res = await apiClient.get<UserMeetingsResponse>('/meetings/my-meetings');
    return res.data;
  },

  endMeeting: async (identifier: string): Promise<{ success: boolean; data: Meeting }> => {
    const res = await apiClient.post<{ success: boolean; data: Meeting }>(`/meetings/${identifier}/end`);
    return res.data;
  },

  updateMeeting: async (
    identifier: string,
    data: Partial<CreateMeetingDTO>
  ): Promise<{ success: boolean; data: Meeting }> => {
    const res = await apiClient.patch<{ success: boolean; data: Meeting }>(`/meetings/${identifier}`, data);
    return res.data;
  },
};
