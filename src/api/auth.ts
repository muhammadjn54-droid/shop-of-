import api, { authApi } from './api';
import type { User, AuthTokens } from '../types';

export interface RegisterCredentials {
  username: string;
  email?: string;
  password: string;
  password2: string;
}

export const login = async (credentials: { username: string; password: string }): Promise<AuthTokens> =>
  (await authApi.post<AuthTokens>('/api/auth/login/', credentials)).data;

export const register = async (credentials: RegisterCredentials): Promise<AuthTokens> =>
  (await authApi.post<AuthTokens>('/api/auth/register/', credentials)).data;

export const getMe = async (): Promise<User> => (await api.get<User>('/api/auth/me/')).data;

export const updateProfile = async (profile: { username: string; first_name?: string; last_name?: string }): Promise<User> =>
  (await api.patch<User>('/api/auth/me/', profile)).data;

export const logoutUser = async (refresh: string): Promise<void> => {
  await authApi.post('/api/auth/logout/', { refresh });
};

export const requestPasswordReset = async (email: string): Promise<{ message: string }> =>
  (await authApi.post('/api/auth/forgot-password/', { email })).data;

export const confirmPasswordReset = async (data: { uid: string; token: string; password: string; confirm_password: string }): Promise<{ message: string }> =>
  (await authApi.post('/api/auth/reset-password/', data)).data;
