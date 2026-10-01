import api from './api';
import type { User, AuthTokens } from '../types';

export const register = async (userData: {
  username: string;
  password: string;
  password2?: string;
  email?: string;
}): Promise<AuthTokens> => {
  const response = await api.post<AuthTokens>('/api/auth/register/', userData);
  return response.data;
};

export const login = async (credentials: {
  username: string;
  password: string;
}): Promise<AuthTokens> => {
  const response = await api.post<AuthTokens>('/api/auth/login/', credentials);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/api/auth/me/');
  return response.data;
};

export const logoutUser = async (refreshToken: string): Promise<unknown> => {
  try {
    const response = await api.post('/api/auth/logout/', { refresh: refreshToken });
    return response.data;
  } catch (err) {
    // Even if logout fails on server (e.g. expired refresh token), proceed client-side
    console.warn('Logout API error:', err);
    return null;
  }
};

export const refreshToken = async (refresh: string): Promise<{ access: string }> => {
  const response = await api.post<{ access: string }>('/api/auth/token/refresh/', { refresh });
  return response.data;
};
