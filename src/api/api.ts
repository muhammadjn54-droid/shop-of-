import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearSession, getSession, updateSessionTokens } from './session';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://shop-becend.vercel.app').replace(/\/+$/, '');
export const authApi = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });
const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

interface SessionRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _sessionId?: string;
}

const sessionChanged = () => new axios.CanceledError('Сессия изменилась. Повторите действие.');
let refreshing: { id: string; promise: Promise<string> } | null = null;

async function refreshAccess(sessionId: string): Promise<string> {
  const session = getSession();
  if (!session || session.id !== sessionId) throw sessionChanged();
  if (!session.refresh) {
    clearSession(sessionId);
    throw new Error('Сессия истекла. Войдите снова.');
  }
  try {
    const { data } = await authApi.post<{ access: string; refresh?: string }>(
      '/api/auth/token/refresh/', { refresh: session.refresh },
    );
    if (!updateSessionTokens(sessionId, data)) throw sessionChanged();
    return data.access;
  } catch (error) {
    const current = getSession();
    if (current?.id !== sessionId) throw sessionChanged();
    if (current.refresh !== session.refresh && current.access) return current.access;
    if (axios.isAxiosError(error) && [400, 401].includes(error.response?.status ?? 0)) {
      clearSession(sessionId);
    }
    throw error;
  }
}

api.interceptors.request.use((config: SessionRequest) => {
  const session = getSession();
  if (config._sessionId && config._sessionId !== session?.id) throw sessionChanged();
  config._sessionId = session?.id;
  if (session?.access) config.headers.Authorization = 'Bearer ' + session.access;
  else config.headers.delete('Authorization');
  return config;
});

api.interceptors.response.use(
  (response) => {
    const request = response.config as SessionRequest;
    if (request._sessionId && getSession()?.id !== request._sessionId) throw sessionChanged();
    return response;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;
    const request = error.config as SessionRequest | undefined;
    if (!request || error.response?.status !== 401) throw error;
    const session = getSession();
    if (!session || session.id !== request._sessionId) throw sessionChanged();
    if (request._retry) {
      if (request.headers.Authorization === 'Bearer ' + session.access) clearSession(session.id);
      throw error;
    }
    request._retry = true;
    // A delayed 401 may belong to a token another request already refreshed.
    if (session.access && request.headers.Authorization !== 'Bearer ' + session.access) return api(request);
    if (!refreshing || refreshing.id !== session.id) {
      const pending = { id: session.id, promise: refreshAccess(session.id) };
      refreshing = pending;
      void pending.promise.finally(() => {
        if (refreshing === pending) refreshing = null;
      }).catch(() => {});
    }
    await refreshing.promise;
    return api(request);
  },
);

export default api;
