import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

// Mock users for demonstration
const MOCK_USERS = {
  'user@example.com': { password: 'user123', userId: 'user-1', role: 'user' as UserRole, name: 'Alex Chen' },
  'admin@example.com': { password: 'admin123', userId: 'admin-1', role: 'admin' as UserRole, name: 'Admin User' },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS];
    
    if (!mockUser || mockUser.password !== password) {
      return false;
    }

    // Validate role matches
    if (mockUser.role !== role) {
      return false;
    }

    const userData: User = {
      userId: mockUser.userId,
      role: mockUser.role,
      name: mockUser.name,
      email,
    };

    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
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
