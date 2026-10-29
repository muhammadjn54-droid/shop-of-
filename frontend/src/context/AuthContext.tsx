import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
  logoutUser,
} from '../api/auth';
import toast from 'react-hot-toast';
import { formatLoginError, formatRegisterError } from '../utils/authErrors';
import type { User } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<User>;
  register: (userData: {
    username: string;
    email?: string;
    password: string;
    password2?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initAuth = async () => {
      const access = localStorage.getItem('access');
      const refresh = localStorage.getItem('refresh');
      const cached = localStorage.getItem('shop_user');

      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          // ignore parsing error
        }
      }

      if (!access && !refresh) {
        setUser(null);
        localStorage.removeItem('shop_user');
        setLoading(false);
        return;
      }

      try {
        const userData = await getMe();
        setUser(userData);
        localStorage.setItem('shop_user', JSON.stringify(userData));
      } catch (err: unknown) {
        // Only if tokens were actually wiped because refresh expired/failed
        if (!localStorage.getItem('access') && !localStorage.getItem('refresh')) {
          setUser(null);
          localStorage.removeItem('shop_user');
        } else {
          const message = err instanceof Error ? err.message : String(err);
          console.warn('Could not load profile from server, keeping offline session:', message);
          if (!cached) {
            try {
              const token = access || refresh;
              if (token) {
                const parts = token.split('.');
                if (parts.length === 3) {
                  const payload = JSON.parse(atob(parts[1]));
                  const fallbackUser: User = {
                    id: payload.sub,
                    username: payload.username || 'Пользователь',
                    email: payload.email || undefined,
                    createdAt: new Date().toISOString(),
                  };
                  setUser(fallbackUser);
                  localStorage.setItem('shop_user', JSON.stringify(fallbackUser));
                }
              }
            } catch {}
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (credentials: { username: string; password: string }): Promise<User> => {
    setLoading(true);
    const rawInput = (credentials.username || '').trim();
    const password = credentials.password;

    try {
      const data = await apiLogin({ username: rawInput, password });

      if (data.access) {
        localStorage.setItem('access', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh', data.refresh);
      }

      // Fetch user profile
      const userData = await getMe();
      setUser(userData);
      localStorage.setItem('shop_user', JSON.stringify(userData));
      toast.success('Добро пожаловать, ' + (userData.username || 'пользователь') + '!');
      return userData;
    } catch (err: unknown) {
      throw new Error(formatLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (userData: {
    username: string;
    email?: string;
    password: string;
    password2?: string;
  }): Promise<User> => {
    setLoading(true);
    try {
      const data = await apiRegister(userData);

      if (data.access) {
        localStorage.setItem('access', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh', data.refresh);
      }

      const userProfile = await getMe();
      setUser(userProfile);
      localStorage.setItem('shop_user', JSON.stringify(userProfile));
      toast.success('Аккаунт успешно создан! Добро пожаловать, ' + userProfile.username + '!');
      return userProfile;
    } catch (err: unknown) {
      throw new Error(formatRegisterError(err));
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    const refresh = localStorage.getItem('refresh');
    try {
      if (refresh) {
        await logoutUser(refresh);
      }
    } catch (e) {
      console.warn('Logout error ignored:', e);
    } finally {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('shop_user');
      setUser(null);
      toast.success('Вы успешно вышли из системы');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await getMe();
      setUser(userData);
      localStorage.setItem('shop_user', JSON.stringify(userData));
    } catch (e) {
      console.warn('Could not refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
