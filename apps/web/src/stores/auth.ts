import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import type { UserDto, AuthResponse, Locale } from '@arazchat/shared';
import { api } from '@/lib/api';

const TOKEN_KEY = 'arazchat_token';
const REFRESH_KEY = 'arazchat_refresh';
const USER_KEY = 'arazchat_user';
const DEVICE_KEY = 'arazchat_device_id';

/** Prefer randomUUID; fall back when not in a secure context (HTTP + non-localhost). */
function createDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = createDeviceId();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function deviceName() {
  return navigator.userAgent.slice(0, 120);
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY));
  const user = ref<UserDto | null>(
    localStorage.getItem(USER_KEY)
      ? JSON.parse(localStorage.getItem(USER_KEY)!)
      : null,
  );

  const isLoggedIn = computed(() => !!token.value);

  function setSession(data: AuthResponse) {
    token.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    user.value = data.user;
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  async function register(mobile: string, password: string, displayName?: string) {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      mobile,
      password,
      displayName,
      deviceId: getDeviceId(),
      deviceName: deviceName(),
    });
    setSession(data);
  }

  async function login(mobile: string, password: string) {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      mobile,
      password,
      deviceId: getDeviceId(),
      deviceName: deviceName(),
    });
    setSession(data);
  }

  async function refresh(): Promise<boolean> {
    if (!refreshToken.value) return false;
    try {
      const { data } = await axios.post<AuthResponse>('/api/auth/refresh', {
        refreshToken: refreshToken.value,
        deviceId: getDeviceId(),
      });
      setSession(data);
      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    try {
      if (refreshToken.value) {
        await api.post('/auth/logout', { refreshToken: refreshToken.value });
      }
    } catch {
      /* ignore */
    }
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function setUser(next: UserDto) {
    user.value = next;
    localStorage.setItem(USER_KEY, JSON.stringify(next));
  }

  function setLocale(locale: Locale) {
    if (user.value) setUser({ ...user.value, locale });
  }

  return {
    token,
    refreshToken,
    user,
    isLoggedIn,
    register,
    login,
    refresh,
    logout,
    setUser,
    setLocale,
    getDeviceId,
  };
});
