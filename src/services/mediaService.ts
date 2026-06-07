import axios, { AxiosProgressEvent } from 'axios';
import api from './api';

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
  expiresAt?: string;
}

const getStoredUserId = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedUser = localStorage.getItem('currentUser');

  if (!storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser) as { id?: unknown };
    return typeof user.id === 'number' ? user.id : null;
  } catch {
    return null;
  }
};

const createIdempotencyKey = () => crypto.randomUUID();

export const mediaService = {
  getPresignedUrl: async (
    data: PresignedUrlRequest,
    idempotencyKey = createIdempotencyKey()
  ): Promise<PresignedUrlResponse> => {
    const response = await api.post<PresignedUrlResponse>('/api/v1/media/presigned-url', data, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });

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
    const userId = getStoredUserId();

    if (!userId) {
      throw new Error('Cannot upload media without current user id.');
    }

    const mediaId = await mediaService.uploadViaPresignedUrl(userId, file, onUploadProgress);
    return { mediaId, url: '' };
  },

  uploadVideo: async (file: File, onUploadProgress?: (event: AxiosProgressEvent) => void): Promise<MediaUploadResponse> => {
    const userId = getStoredUserId();

    if (!userId) {
      throw new Error('Cannot upload media without current user id.');
    }

    const mediaId = await mediaService.uploadViaPresignedUrl(userId, file, onUploadProgress);
    return { mediaId, url: '' };
  },

  uploadMedia: async (file: File, onUploadProgress?: (event: AxiosProgressEvent) => void): Promise<MediaUploadResponse> => {
    if (file.type.startsWith('video/')) {
      return mediaService.uploadVideo(file, onUploadProgress);
    }

    return mediaService.uploadImage(file, onUploadProgress);
  },

  deleteMedia: async (mediaId: number): Promise<void> => {
    console.warn(`media-service backend does not expose delete endpoint for media ${mediaId}.`);
  },
};
