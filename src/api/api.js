import axios from 'axios';

const API_BASE_URL = "https://shop-becend.vercel.app";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shared refresh promise to prevent multiple simultaneous refresh requests
let refreshPromise = null;

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem('access');
    if (access && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry for auth endpoints to avoid infinite loops
    if (
      originalRequest.url.includes('/api/auth/login/') ||
      originalRequest.url.includes('/api/auth/register/') ||
      originalRequest.url.includes('/api/auth/token/refresh/') ||
      originalRequest.url.includes('/api/auth/logout/')
    ) {
      return Promise.reject(error);
    }

    // Only handle real 401 responses (not network errors or 5xx)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refresh = localStorage.getItem('refresh');

    if (!refresh) {
      // No refresh token available — clear and let AuthContext handle redirect
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      return Promise.reject(error);
    }

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

    // Start a new refresh
    refreshPromise = axios
      .post(`${API_BASE_URL}/api/auth/token/refresh/`, { refresh })
      .then((res) => {
        const newAccess = res.data.access;
        localStorage.setItem('access', newAccess);

        // Save rotated refresh token if backend returns one
        if (res.data.refresh) {
          localStorage.setItem('refresh', res.data.refresh);
        }

        return newAccess;
      })
      .catch((refreshError) => {
        // Only clear tokens if refresh was truly rejected (not network error)
        if (refreshError.response) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
        }
        throw refreshError;
      })
      .finally(() => {
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
