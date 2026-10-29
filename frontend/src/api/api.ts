import axios, { type InternalAxiosRequestConfig } from 'axios';

// Base URL of the backend, without a trailing slash and WITHOUT /api
const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shared refresh promise to prevent multiple simultaneous refresh requests
let refreshPromise: Promise<string> | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'refresh' && e.newValue === null) {
      localStorage.removeItem('access');
    }
  });
}

// Endpoints that must never trigger a refresh/retry loop.
const AUTH_ENDPOINTS: string[] = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/token/refresh',
  '/api/auth/logout',
];

interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Request interceptor: attach access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const access = localStorage.getItem('access');
    if (access && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const doRefresh = (): Promise<string> => {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return Promise.reject(new Error('no-refresh-token'));

  return axios
    .post<{ access: string; refresh?: string }>(`${API_BASE_URL}/api/auth/refresh`, { refresh })
    .then((res) => {
      localStorage.setItem('access', res.data.access);
      if (res.data.refresh) {
        localStorage.setItem('refresh', res.data.refresh);
      }
      return res.data.access;
    })
    .catch((err) => {
      const status = err.response?.status;
      if (status === 400 || status === 401) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
      }
      throw err;
    });
};

// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomInternalAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (AUTH_ENDPOINTS.some((url) => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (refreshPromise) {
      try {
        const newAccess = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });

    try {
      const newAccess = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;
