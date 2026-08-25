import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

export const api = axios.create({
  baseURL: '/api',
});

let refreshing: Promise<boolean> | null = null;

api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  if (auth.refreshToken) {
    config.headers['x-refresh-token'] = auth.refreshToken;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const auth = useAuthStore();
      refreshing ??= auth.refresh().finally(() => {
        refreshing = null;
      });
      const ok = await refreshing;
      if (ok) {
        original.headers.Authorization = `Bearer ${auth.token}`;
        return api(original);
      }
      await auth.logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
