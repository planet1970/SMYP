import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth';
import type { LoginPayload, LoginResponse } from '../services/auth';

type AuthState = {
  token: string | null;
  user: LoginResponse['user'] | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthState | undefined>(undefined);
const TOKEN_KEY = 'smyp_token';
const USER_KEY = 'smyp_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Auth initialization failed:", e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.login(payload);
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch (err: any) {
      setError(err?.message || 'Giriş başarısız');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const value = useMemo(
    () => ({ token, user, login, logout, loading, error }),
    [token, user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
};
