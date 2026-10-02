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
  getMe,
  logoutUser,
} from '../api/auth';
import toast from 'react-hot-toast';
import type { User } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
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

      if (!access && !refresh) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // First attempt to get profile with current access token
        const userData = await getMe();
        setUser(userData);
      } catch (err: unknown) {
        // The interceptor already tried to refresh. Tokens are only removed
        // when the refresh token is genuinely rejected, so if they are still
        // here the session is alive and this was a transient failure
        // (5xx or network). Logging out here would throw the user out on
        // every hiccup, so keep the tokens and let the next request retry.
        if (!localStorage.getItem('access') && !localStorage.getItem('refresh')) {
          setUser(null);
        } else {
          const message = err instanceof Error ? err.message : String(err);
          console.warn('Could not load profile, session kept:', message);
          setUser(null);
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
      toast.success(`Добро пожаловать, ${userData.username || 'пользователь'}!`);
      return userData;
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: {
            detail?: string;
            non_field_errors?: string[];
          };
        };
      };
      const errorMsg =
        axiosErr.response?.data?.detail ||
        axiosErr.response?.data?.non_field_errors?.[0] ||
        'Неверное имя пользователя или пароль';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler — fires ONLY when user clicks "Выйти"
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
      setUser(null);
      toast.success('Вы вышли из системы');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
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
