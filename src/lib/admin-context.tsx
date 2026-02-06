import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AdminStats, SharedFile, ActivityEvent } from './types';
import { adminAPI } from '../services/api';

interface AdminContextType {
  stats: AdminStats | null;
  allFiles: SharedFile[];
  allActivity: ActivityEvent[];
  loading: boolean;
  refreshStats: () => Promise<void>;
  refreshAllFiles: () => Promise<void>;
  refreshAllActivity: () => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allFiles, setAllFiles] = useState<SharedFile[]>([]);
  const [allActivity, setAllActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAllFiles = useCallback(async () => {
    try {
      const response = await adminAPI.getAllFiles();
      if (response.success) {
        setAllFiles(response.data.files);
      }
    } catch (error) {
      console.error('Failed to fetch all files:', error);
    }
  }, []);

  const refreshAllActivity = useCallback(async () => {
    try {
      const response = await adminAPI.getAllActivities();
      if (response.success) {
        setAllActivity(response.data.activities);
      }
    } catch (error) {
      console.error('Failed to fetch all activity:', error);
    }
  }, []);

  const deleteFile = useCallback(async (id: string) => {
    try {
      const response = await adminAPI.deleteFile(id);
      if (response.success) {
        setAllFiles(prev => prev.filter(f => f.id !== id));
        // Refresh stats after deletion
        refreshStats();
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }, [refreshStats]);

  useEffect(() => {
    // Only fetch if user is authenticated as admin
    const authUser = localStorage.getItem('auth_user');
    if (authUser) {
      try {
        const user = JSON.parse(authUser);
        if (user.role === 'admin') {
          refreshStats();
          refreshAllFiles();
          refreshAllActivity();
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, [refreshStats, refreshAllFiles, refreshAllActivity]);

  return (
    <AdminContext.Provider value={{
      stats,
      allFiles,
      allActivity,
      loading,
      refreshStats,
      refreshAllFiles,
      refreshAllActivity,
      deleteFile,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
