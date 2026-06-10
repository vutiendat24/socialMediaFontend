import axios, { AxiosError } from 'axios';

const getApiUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (!configuredUrl) {
    return 'http://127.0.0.1:8080';
  }

  if (configuredUrl.startsWith('/') || /^https?:\/\//i.test(configuredUrl)) {
    return configuredUrl;
  }

  return `http://${configuredUrl}`;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error: unknown, fallback = 'Co loi xay ra'): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const axiosError = error as AxiosError<{ message?: string; error?: string }>;

  if (!axiosError.response) {
    return 'Khong ket noi duoc backend. Hay chay API Gateway (port 8080) hoac docker compose up.';
  }

  const data = axiosError.response.data as string | { message?: string; error?: string } | undefined;
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object' && data.message) {
    return data.message;
  }

  if (data && typeof data === 'object' && data.error) {
    return data.error;
  }

  return fallback;
};

export default api;
