import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

export type UserRole = 'user' | 'admin';

interface User {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage immediately during initialization
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_user');
        return null;
      }
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // Call appropriate login endpoint based on role
      const response = role === 'admin' 
        ? await authAPI.adminLogin(email, password)
        : await authAPI.login(email, password);

      if (response.success) {
        const { user: userData, accessToken, refreshToken } = response.data;

        // Store tokens
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        // Store user data
        const userInfo: User = {
          userId: userData.userId,
          role: userData.role,
          name: userData.name,
          email: userData.email,
        };

        setUser(userInfo);
        localStorage.setItem('auth_user', JSON.stringify(userInfo));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Call logout endpoint (optional, for logging purposes)
    authAPI.logout().catch(() => {
      // Ignore errors on logout
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
