import { apiClient } from './client';
import { FileAttachment } from '../types';

export const fileApi = {
  uploadFile: async (
    meetingId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; data: FileAttachment }> => {
    const formData = new FormData();
    formData.append('meetingId', meetingId);
    formData.append('file', file);

    const res = await apiClient.post<{ success: boolean; data: FileAttachment }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data;
  },

  getMeetingFiles: async (meetingId: string): Promise<{ success: boolean; data: FileAttachment[] }> => {
    const res = await apiClient.get<{ success: boolean; data: FileAttachment[] }>(`/files/meeting/${meetingId}`);
    return res.data;
  },

  getDownloadUrl: (fileId: string): string => {
    return `/api/files/download/${fileId}`;
  },
};
