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

const createIdempotencyKey = () => crypto.randomUUID();

export const mediaService = {
  getPresignedUrl: async (
    data: PresignedUrlRequest,
    idempotencyKey = createIdempotencyKey()
  ): Promise<PresignedUrlResponse> => {
    const response = await api.post<PresignedUrlResponse>(
      `/api/media/presigned-url`,
      data,
      {
        headers: {
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
    const response = await api.post<MediaUploadResponse>('/api/media/upload', createUploadForm(file), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  uploadVideo: async (file: File, onUploadProgress?: (event: AxiosProgressEvent) => void): Promise<MediaUploadResponse> => {
    const response = await api.post<MediaUploadResponse>('/api/media/upload/video', createUploadForm(file), {
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
    await api.delete(`/api/media/${mediaId}`);
  },
};
