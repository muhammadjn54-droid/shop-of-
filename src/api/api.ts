import axios, { type InternalAxiosRequestConfig } from 'axios';

// Base URL of the backend, without a trailing slash and WITHOUT /api
// (every call below appends /api/... itself).
// Set VITE_API_URL in .env to point the frontend at another deployment,
// for example the Render service instead of Vercel.
const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL || 'https://shop-becend.vercel.app'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shared refresh promise to prevent multiple simultaneous refresh requests
let refreshPromise: Promise<string> | null = null;

// Keep other tabs in sync: when one tab stores new tokens, the others must
// adopt them instead of refreshing with the (still valid, but older) token.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'refresh' && e.newValue === null) {
      // Another tab logged out for real.
      localStorage.removeItem('access');
    }
  });
}

// Endpoints that must never trigger a refresh/retry loop.
const AUTH_ENDPOINTS: string[] = [
  '/api/auth/login/',
  '/api/auth/register/',
  '/api/auth/token/refresh/',
  '/api/auth/logout/',
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
    return config;
  },
  (error) => Promise.reject(error)
);

const doRefresh = (): Promise<string> => {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return Promise.reject(new Error('no-refresh-token'));

  return axios
    .post<{ access: string; refresh?: string }>(`${API_BASE_URL}/api/auth/token/refresh/`, { refresh })
    .then((res) => {
      localStorage.setItem('access', res.data.access);
      if (res.data.refresh) {
        localStorage.setItem('refresh', res.data.refresh);
      }
      return res.data.access;
    })
    .catch((err) => {
      // Only a real rejection of the token itself (400/401) means the session
      // is really over. A 5xx or a network error must NOT destroy the session,
      // otherwise a transient server hiccup logs the user out.
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

    // Network error / timeout: no config, nothing to retry.
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Skip retry for auth endpoints to avoid infinite loops
    if (AUTH_ENDPOINTS.some((url) => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

    // Only handle real 401 responses (not network errors or 5xx)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If a refresh is already in progress, wait for it
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
