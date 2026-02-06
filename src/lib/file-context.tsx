import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SharedFile, ActivityEvent } from './types';
import { fileAPI, activityAPI } from '../services/api';

interface FileContextType {
  files: SharedFile[];
  activity: ActivityEvent[];
  loading: boolean;
  addFile: (file: File, maxDownloads: number, expiryHours: number, visibility: 'public' | 'private') => Promise<void>;
  updateFile: (id: string, updates: Partial<SharedFile>) => void;
  revokeFile: (id: string) => Promise<void>;
  regenerateToken: (id: string) => Promise<void>;
  bulkRevoke: (ids: string[]) => Promise<void>;
  refreshFiles: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
}

const FileContext = createContext<FileContextType | null>(null);

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch files on mount
  const refreshFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fileAPI.getUserFiles();
      if (response.success) {
        setFiles(response.data.files);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch activity on mount
  const refreshActivity = useCallback(async () => {
    try {
      const response = await activityAPI.getUserActivities();
      if (response.success) {
        setActivity(response.data.activities);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    }
  }, []);

  useEffect(() => {
    // Only fetch if user is authenticated
    const authUser = localStorage.getItem('auth_user');
    if (authUser) {
      refreshFiles();
      refreshActivity();
    }
  }, [refreshFiles, refreshActivity]);

  const addFile = useCallback(async (
    file: File, 
    maxDownloads: number, 
    expiryHours: number, 
    visibility: 'public' | 'private'
  ) => {
    try {
      const response = await fileAPI.uploadFile(file, maxDownloads, expiryHours, visibility);
      if (response.success) {
        setFiles(prev => [response.data.file, ...prev]);
        // Refresh activity to get the upload event
        refreshActivity();
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }, [refreshActivity]);

  const updateFile = useCallback((id: string, updates: Partial<SharedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const revokeFile = useCallback(async (id: string) => {
    try {
      const response = await fileAPI.revokeFile(id);
      if (response.success) {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'revoked' as const } : f));
        // Refresh activity to get the revoke event
        refreshActivity();
      }
    } catch (error) {
      console.error('Failed to revoke file:', error);
      throw error;
    }
  }, [refreshActivity]);

  const regenerateToken = useCallback(async (id: string) => {
    try {
      const response = await fileAPI.regenerateToken(id);
      if (response.success) {
        const updatedFile = response.data.file;
        setFiles(prev => prev.map(f => f.id === id ? {
          ...f,
          accessToken: updatedFile.accessToken,
          status: updatedFile.status,
          expiryTimestamp: updatedFile.expiryTimestamp,
        } : f));
        // Refresh activity to get the regenerate event
        refreshActivity();
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      throw error;
    }
  }, [refreshActivity]);

  const bulkRevoke = useCallback(async (ids: string[]) => {
    try {
      // Revoke each file individually
      await Promise.all(ids.map(id => fileAPI.revokeFile(id)));
      setFiles(prev => prev.map(f => ids.includes(f.id) ? { ...f, status: 'revoked' as const } : f));
      // Refresh activity to get all revoke events
      refreshActivity();
    } catch (error) {
      console.error('Failed to bulk revoke files:', error);
      throw error;
    }
  }, [refreshActivity]);

  const deleteFile = useCallback(async (id: string) => {
    try {
      const response = await fileAPI.deleteFile(id);
      if (response.success) {
        setFiles(prev => prev.filter(f => f.id !== id));
        // Refresh activity
        refreshActivity();
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }, [refreshActivity]);

  return (
    <FileContext.Provider value={{ 
      files, 
      activity, 
      loading,
      addFile, 
      updateFile, 
      revokeFile, 
      regenerateToken, 
      bulkRevoke,
      refreshFiles,
      refreshActivity,
      deleteFile,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFiles must be used within FileProvider');
  return ctx;
}
