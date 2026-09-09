import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import type { User, UserRole, AuthState } from '../types';

interface AuthContextValue extends AuthState {
  login: (identifier: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    setState({ user, isAuthenticated: !!user, isLoading: false });
  }, []);

  const login = useCallback(async (identifier: string, password: string, role: UserRole) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const user = await authService.login({ identifier, password, role });
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
