import axios, { AxiosProgressEvent } from 'axios';
import api from './api';

export interface MediaUploadResponse {
  url: string;
  mediaId: number;
  mediaUrl?: string;
  fileType?: string;
}

export interface PresignedUrlRequest {
  userId: number;
  fileType: string;
  fileSize: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  mediaId: number;
  mediaUrl: string;
  expiresAt?: string;
}

export interface UploadedMedia {
  mediaId: number;
  mediaUrl: string;
  fileType: string;
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

const getMediaBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_MEDIA_URL?.trim();

  if (!configuredUrl) {
    return 'http://127.0.0.1:8084';
  }

  if (configuredUrl.startsWith('/') || /^https?:\/\//i.test(configuredUrl)) {
    return configuredUrl.replace(/\/$/, '');
  }

  return `http://${configuredUrl}`.replace(/\/$/, '');
};

const getMediaUrl = (mediaId: number): string => {
  const baseUrl = getMediaBaseUrl();
  return baseUrl.endsWith('/media') ? `${baseUrl}/${mediaId}` : `${baseUrl}/media/${mediaId}`;
};

export const mediaService = {
  getMediaUrl,

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
  ): Promise<UploadedMedia> => {
    const presigned = await mediaService.getPresignedUrl({
      userId,
      fileType: file.type,
      fileSize: file.size,
    });

    await mediaService.uploadToPresignedUrl(presigned.uploadUrl, file, onUploadProgress);

    return {
      mediaId: presigned.mediaId,
      mediaUrl: presigned.mediaUrl || mediaService.getMediaUrl(presigned.mediaId),
      fileType: file.type,
    };
  },

  uploadImage: async (file: File, onUploadProgress?: (event: AxiosProgressEvent) => void): Promise<MediaUploadResponse> => {
    const userId = getStoredUserId();

    if (!userId) {
      throw new Error('Cannot upload media without current user id.');
    }

    const uploaded = await mediaService.uploadViaPresignedUrl(userId, file, onUploadProgress);
    return { mediaId: uploaded.mediaId, url: uploaded.mediaUrl, mediaUrl: uploaded.mediaUrl, fileType: uploaded.fileType };
  },

  uploadVideo: async (file: File, onUploadProgress?: (event: AxiosProgressEvent) => void): Promise<MediaUploadResponse> => {
    const userId = getStoredUserId();

    if (!userId) {
      throw new Error('Cannot upload media without current user id.');
    }

    const uploaded = await mediaService.uploadViaPresignedUrl(userId, file, onUploadProgress);
    return { mediaId: uploaded.mediaId, url: uploaded.mediaUrl, mediaUrl: uploaded.mediaUrl, fileType: uploaded.fileType };
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
