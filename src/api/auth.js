import api from './api';

export const register = async (userData) => {
  const response = await api.post('/api/auth/register/', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/api/auth/login/', credentials);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/api/auth/me/');
  return response.data;
};

export const logoutUser = async (refreshToken) => {
  try {
    const response = await api.post('/api/auth/logout/', { refresh: refreshToken });
    return response.data;
  } catch (err) {
    // Even if logout fails on server (e.g. expired refresh token), proceed client-side
    console.warn('Logout API error:', err);
    return null;
  }
};

export const refreshToken = async (refresh) => {
  const response = await api.post('/api/auth/token/refresh/', { refresh });
  return response.data;
};
