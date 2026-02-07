import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileAPI } from '@/services/api';

describe('File Download Functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock window.URL methods
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document methods
    document.createElement = vi.fn((tag: string) => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          click: vi.fn(),
          style: {},
        } as any;
      }
      return document.createElement(tag);
    });
    
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  describe('downloadFileByToken', () => {
    it('should successfully download a file with valid token', async () => {
      // Setup: Create a mock file in localStorage
      const mockFile = {
        id: 'test-file-1',
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        accessToken: 'valid-token-123',
        expiryTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        maxDownloads: 5,
        usedDownloads: 0,
        status: 'active' as const,
        visibility: 'private' as const,
        uploadedBy: 'user-1',
        uploadedByName: 'Test User',
        fileData: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
      };

      localStorage.setItem('vaultdrop_files', JSON.stringify([mockFile]));
      localStorage.setItem('vaultdrop_activities', JSON.stringify([]));
      localStorage.setItem('vaultdrop_initialized', 'true');

      // Execute: Download the file
      const response = await fileAPI.downloadFileByToken('valid-token-123');

      // Verify: Response should contain blob data
      expect(response.data).toBeInstanceOf(Blob);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('test.pdf');

      // Verify: Download count should be incremented
      const files = JSON.parse(localStorage.getItem('vaultdrop_files') || '[]');
      expect(files[0].usedDownloads).toBe(1);

      // Verify: Activity should be logged
      const activities = JSON.parse(localStorage.getItem('vaultdrop_activities') || '[]');
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].eventType).toBe('download_success');
    });

    it('should reject download for revoked file', async () => {
      const revokedFile = {
        id: 'test-file-2',
        name: 'revoked.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        accessToken: 'revoked-token-123',
        expiryTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        maxDownloads: 5,
        usedDownloads: 0,
        status: 'revoked' as const,
        visibility: 'private' as const,
        uploadedBy: 'user-1',
        uploadedByName: 'Test User',
        fileData: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
      };

      localStorage.setItem('vaultdrop_files', JSON.stringify([revokedFile]));
      localStorage.setItem('vaultdrop_activities', JSON.stringify([]));
      localStorage.setItem('vaultdrop_initialized', 'true');

      await expect(
        fileAPI.downloadFileByToken('revoked-token-123')
      ).rejects.toThrow('This link has been revoked');
    });

    it('should reject download for expired token', async () => {
      const expiredFile = {
        id: 'test-file-3',
        name: 'expired.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        accessToken: 'expired-token-123',
        expiryTimestamp: new Date(Date.now() - 1000).toISOString(), // Expired
        maxDownloads: 5,
        usedDownloads: 0,
        status: 'active' as const,
        visibility: 'private' as const,
        uploadedBy: 'user-1',
        uploadedByName: 'Test User',
        fileData: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
      };

      localStorage.setItem('vaultdrop_files', JSON.stringify([expiredFile]));
      localStorage.setItem('vaultdrop_activities', JSON.stringify([]));
      localStorage.setItem('vaultdrop_initialized', 'true');

      await expect(
        fileAPI.downloadFileByToken('expired-token-123')
      ).rejects.toThrow('This link has expired');
    });

    it('should reject download when download limit is reached', async () => {
      const limitReachedFile = {
        id: 'test-file-4',
        name: 'limit.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        accessToken: 'limit-token-123',
        expiryTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        maxDownloads: 5,
        usedDownloads: 5, // Limit reached
        status: 'active' as const,
        visibility: 'private' as const,
        uploadedBy: 'user-1',
        uploadedByName: 'Test User',
        fileData: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
      };

      localStorage.setItem('vaultdrop_files', JSON.stringify([limitReachedFile]));
      localStorage.setItem('vaultdrop_activities', JSON.stringify([]));
      localStorage.setItem('vaultdrop_initialized', 'true');

      await expect(
        fileAPI.downloadFileByToken('limit-token-123')
      ).rejects.toThrow('Download limit reached');
    });

    it('should allow unlimited downloads when maxDownloads is 0', async () => {
      const unlimitedFile = {
        id: 'test-file-5',
        name: 'unlimited.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        accessToken: 'unlimited-token-123',
        expiryTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        maxDownloads: 0, // Unlimited
        usedDownloads: 999,
        status: 'active' as const,
        visibility: 'private' as const,
        uploadedBy: 'user-1',
        uploadedByName: 'Test User',
        fileData: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
      };

      localStorage.setItem('vaultdrop_files', JSON.stringify([unlimitedFile]));
      localStorage.setItem('vaultdrop_activities', JSON.stringify([]));
      localStorage.setItem('vaultdrop_initialized', 'true');

      const response = await fileAPI.downloadFileByToken('unlimited-token-123');

      expect(response.data).toBeInstanceOf(Blob);
      
      // Verify: Download count should be incremented even at 999
      const files = JSON.parse(localStorage.getItem('vaultdrop_files') || '[]');
      expect(files[0].usedDownloads).toBe(1000);
    });

    it('should reject download for invalid token', async () => {
      localStorage.setItem('vaultdrop_files', JSON.stringify([]));
      localStorage.setItem('vaultdrop_initialized', 'true');

      await expect(
        fileAPI.downloadFileByToken('invalid-token')
      ).rejects.toThrow('File not found');
    });
  });
});
