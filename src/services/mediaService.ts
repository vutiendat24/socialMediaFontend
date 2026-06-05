import api from './api';
import axios, { AxiosProgressEvent } from 'axios';

export interface MediaUploadResponse {
  url: string;
  mediaId: number;
}

export interface PresignedUrlRequest {
  userId: number;
  fileType: string;
  fileSize: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  mediaId: number;
}

const createUploadForm = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
};

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

const getAccessToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

const createIdempotencyKey = () => crypto.randomUUID();

export const mediaService = {
  getPresignedUrl: async (
    data: PresignedUrlRequest,
    idempotencyKey = createIdempotencyKey()
  ): Promise<PresignedUrlResponse> => {
    const token = getAccessToken();

    if (!token) {
      throw new Error('Token missing or expired. Please log in again.');
    }

    const response = await axios.post<PresignedUrlResponse>(
      `${API_GATEWAY_URL}/api/v1/media/presigned-url`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    return response.data;
  },

  uploadToPresignedUrl: async (
    uploadUrl: string,
    file: File,
    onUploadProgress?: (event: AxiosProgressEvent) => void
  ): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress,
    });
  },

  uploadViaPresignedUrl: async (
    userId: number,
    file: File,
    onUploadProgress?: (event: AxiosProgressEvent) => void
  ): Promise<number> => {
    const presigned = await mediaService.getPresignedUrl({
      userId,
      fileType: file.type,
      fileSize: file.size,
    });

    await mediaService.uploadToPresignedUrl(presigned.uploadUrl, file, onUploadProgress);

    return presigned.mediaId;
  },

  uploadImage: async (file: File, onUploadProgress?: (event: AxiosProgressEvent) => void): Promise<MediaUploadResponse> => {
    const response = await api.post<MediaUploadResponse>('/v1/media/upload', createUploadForm(file), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  uploadVideo: async (file: File, onUploadProgress?: (event: AxiosProgressEvent) => void): Promise<MediaUploadResponse> => {
    const response = await api.post<MediaUploadResponse>('/v1/media/upload/video', createUploadForm(file), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  uploadMedia: async (file: File, onUploadProgress?: (event: AxiosProgressEvent) => void): Promise<MediaUploadResponse> => {
    if (file.type.startsWith('video/')) {
      return mediaService.uploadVideo(file, onUploadProgress);
    }

    return mediaService.uploadImage(file, onUploadProgress);
  },

  deleteMedia: async (mediaId: number): Promise<void> => {
    await api.delete(`/v1/media/${mediaId}`);
  },
};
