import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logoutUser, type RegisterCredentials } from '../api/auth';
import { clearSession, getSession, SESSION_EVENT, SESSION_KEY, startSession, updateSessionUser } from '../api/session';
import toast from 'react-hot-toast';
import type { AuthTokens, User } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionError: unknown;
  retrySession: () => Promise<void>;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => getSession()?.user ?? null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<unknown>(null);
  const activeId = useRef(getSession()?.id);
  const requestVersion = useRef(0);

  const retrySession = useCallback(async () => {
    const version = ++requestVersion.current;
    const session = getSession();
    activeId.current = session?.id;
    setSessionError(null);
    if (!session) {
      setUserState(null);
      setLoading(false);
      return;
    }
    setLoading(!session.user);
    try {
      const profile = await getMe();
      if (version !== requestVersion.current || getSession()?.id !== session.id) return;
      updateSessionUser(session.id, profile);
      setUserState(profile);
    } catch (error) {
      if (version !== requestVersion.current) return;
      const current = getSession();
      if (current?.id === session.id) {
        setUserState(current.user ?? null);
        setSessionError(error);
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const session = getSession();
      if (session?.id !== activeId.current) {
        ++requestVersion.current;
        activeId.current = session?.id;
        setUserState(session?.user ?? null);
        setSessionError(null);
        setLoading(false);
        if (session && !session.user) void retrySession();
      } else if (session?.user) setUserState(session.user);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) sync();
    };
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', onStorage);
    const onOnline = () => { if (getSession()) void retrySession(); };
    window.addEventListener('online', onOnline);
    void retrySession();
    return () => {
      ++requestVersion.current;
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('online', onOnline);
    };
  }, [retrySession]);

  const acceptLogin = async (tokens: AuthTokens): Promise<User> => {
    ++requestVersion.current;
    const session = startSession(tokens);
    const profile = tokens.user ?? await getMe();
    if (getSession()?.id !== session.id) throw new Error('Сессия изменилась. Войдите снова.');
    updateSessionUser(session.id, profile);
    setUserState(profile);
    setSessionError(null);
    setLoading(false);
    toast.success('Добро пожаловать, ' + (profile.first_name || profile.username) + '!');
    return profile;
  };

  const login = async (credentials: { username: string; password: string }) =>
    acceptLogin(await apiLogin({ ...credentials, username: credentials.username.trim() }));
  const register = async (credentials: RegisterCredentials) =>
    acceptLogin(await apiRegister({ ...credentials, username: credentials.username.trim() }));

  const logout = async () => {
    const session = getSession();
    clearSession();
    setUserState(null);
    setLoading(false);
    setSessionError(null);
    if (session?.refresh) {
      try { await logoutUser(session.refresh); }
      catch { toast.error('Вы вышли на этом устройстве. Сервер не подтвердил завершение сессии.'); return; }
    }
    toast.success('Вы вышли из системы');
  };

  const setUser: Dispatch<SetStateAction<User | null>> = (value) => {
    const session = getSession();
    const next = typeof value === 'function' ? value(session?.user ?? user) : value;
    if (session && next) updateSessionUser(session.id, next);
    setUserState(next);
  };

  return <AuthContext.Provider value={{ user, loading, sessionError, retrySession, isAuthenticated: !!user, login, register, logout, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
