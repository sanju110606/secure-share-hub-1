import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth-context';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('useAuth hook', () => {
    it('should start with no authenticated user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should allow user login with correct credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      let success: boolean = false;
      await act(async () => {
        success = await result.current.login('user@example.com', 'User123!', 'user');
      });

      expect(success).toBe(true);
      expect(result.current.user).toEqual({
        userId: 'user-1',
        role: 'user',
        name: 'Alex Chen',
        email: 'user@example.com',
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should allow admin login with correct credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      let success: boolean = false;
      await act(async () => {
        success = await result.current.login('admin@example.com', 'Admin123!', 'admin');
      });

      expect(success).toBe(true);
      expect(result.current.user?.role).toBe('admin');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should reject login with incorrect password', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      let success: boolean = false;
      await act(async () => {
        success = await result.current.login('user@example.com', 'wrongpassword', 'user');
      });

      expect(success).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should reject user login with admin credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      let success: boolean = false;
      await act(async () => {
        success = await result.current.login('admin@example.com', 'Admin123!', 'user');
      });

      expect(success).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should reject admin login with user credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      let success: boolean = false;
      await act(async () => {
        success = await result.current.login('user@example.com', 'User123!', 'admin');
      });

      expect(success).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should logout user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        await result.current.login('user@example.com', 'User123!', 'user');
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should persist user in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        await result.current.login('user@example.com', 'User123!', 'user');
      });

      const storedUser = localStorage.getItem('auth_user');
      expect(storedUser).toBeTruthy();
      const parsedUser = JSON.parse(storedUser!);
      expect(parsedUser.userId).toBe('user-1');
      expect(parsedUser.role).toBe('user');
    });

    it('should clear localStorage on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        await result.current.login('user@example.com', 'User123!', 'user');
      });

      act(() => {
        result.current.logout();
      });

      const storedUser = localStorage.getItem('auth_user');
      expect(storedUser).toBe(null);
    });
  });
});
