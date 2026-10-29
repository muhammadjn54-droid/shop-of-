import api from './api';
import type { User, AuthTokens } from '../types';

export const login = async (credentials: {
  username: string;
  password: string;
}): Promise<AuthTokens> => {
  const response = await api.post<AuthTokens>('/api/auth/login', credentials);
  return response.data;
};

export const register = async (userData: {
  username: string;
  email?: string;
  password: string;
  password2?: string;
}): Promise<AuthTokens> => {
  const payload = {
    ...userData,
    password2: userData.password2 || userData.password,
  };
  const response = await api.post<AuthTokens>('/api/auth/register', payload);
  return response.data;
};

export const requestPasswordReset = async (
  email: string
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/forgot-password', { email });
  return response.data;
};

export const confirmPasswordReset = async (data: {
  token: string;
  password: string;
}): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/reset-password', data);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/api/auth/me');
  return response.data;
};

export const logoutUser = async (refreshToken: string): Promise<unknown> => {
  try {
    const response = await api.post('/api/auth/logout', { refresh: refreshToken });
    return response.data;
  } catch (err) {
    console.warn('Logout API error:', err);
    return null;
  }
};

export const refreshToken = async (refresh: string): Promise<{ access: string }> => {
  const response = await api.post<{ access: string }>('/api/auth/refresh', { refresh });
  return response.data;
};

export const updateProfile = async (data: {
  username?: string;
  email?: string;
}): Promise<User> => {
  const response = await api.patch<User>('/api/auth/profile', data);
  return response.data;
};

export const changePassword = async (data: {
  oldPassword: string;
  newPassword: string;
}): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/change-password', data);
  return response.data;
};
