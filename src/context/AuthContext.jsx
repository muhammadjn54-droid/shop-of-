import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe, logoutUser, refreshToken as apiRefreshToken } from '../api/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from stored tokens
  const initAuth = useCallback(async () => {
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
    } catch (err) {
      // The interceptor already tried to refresh. Tokens are only removed
      // when the refresh token is genuinely rejected, so if they are still
      // here the session is alive and this was a transient failure
      // (5xx or network). Logging out here would throw the user out on
      // every hiccup, so keep the tokens and let the next request retry.
      if (!localStorage.getItem('access') && !localStorage.getItem('refresh')) {
        setUser(null);
      } else {
        console.warn('Could not load profile, session kept:', err?.message);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Login handler
  const login = async (credentials) => {
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
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Неверное имя пользователя или пароль';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (userDataInput) => {
    setLoading(true);
    try {
      const data = await apiRegister(userDataInput);

      // Save tokens immediately so user is authenticated
      if (data.access) {
        localStorage.setItem('access', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh', data.refresh);
      }

      if (data.user) {
        setUser(data.user);
      } else {
        const fetchedUser = await getMe();
        setUser(fetchedUser);
      }

      toast.success('Регистрация прошла успешно! Добро пожаловать.');
      return data;
    } catch (err) {
      const resData = err.response?.data;
      let errorMsg = 'Ошибка при регистрации';

      if (typeof resData === 'object' && resData !== null) {
        const firstField = Object.keys(resData)[0];
        const val = resData[firstField];
        if (Array.isArray(val)) {
          errorMsg = `${firstField}: ${val[0]}`;
        } else if (typeof val === 'string') {
          errorMsg = val;
        }
      }
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler — fires ONLY when user clicks "Выйти"
  const logout = async () => {
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
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
