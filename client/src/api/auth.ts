import { apiClient } from './client';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  register: async (userData: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', userData);
    return res.data;
  },

  getMe: async (): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: { name?: string; avatarUrl?: string | null }): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.patch<{ success: boolean; data: User }>('/auth/profile', data);
    return res.data;
  },
};
