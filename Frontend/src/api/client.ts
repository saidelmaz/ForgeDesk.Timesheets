import axios, { type InternalAxiosRequestConfig, type AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const AUTH_ENDPOINTS = ['/api/Auth/login', '/api/Auth/register', '/api/Auth/me'];

declare module 'axios' {
  export interface AxiosRequestConfig {
    tenantIdOverride?: string;
  }
}

export const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

function getCurrentTenantId(): string | null {
  try {
    const authStorage = localStorage.getItem('ts-auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.currentTenantId || null;
    }
  } catch { /* ignore */ }
  return null;
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('ts-accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const url = config.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some(e => url.toLowerCase().startsWith(e.toLowerCase()));
    if (!isAuthEndpoint && config.headers) {
      const tenantId = (config as AxiosRequestConfig).tenantIdOverride || getCurrentTenantId();
      if (tenantId) config.headers['X-TenantId'] = tenantId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('ts-accessToken');
      if (token) {
        localStorage.removeItem('ts-accessToken');
        localStorage.removeItem('ts-auth-storage');
        toast.error('Session expired. Please log in again.');
        setTimeout(() => { window.location.href = '/login'; }, 500);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
