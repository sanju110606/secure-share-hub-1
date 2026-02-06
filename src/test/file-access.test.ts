import { describe, it, expect } from 'vitest';
import { SharedFile } from '@/lib/types';

describe('File Access Validation', () => {
  const mockFile: SharedFile = {
    id: 'test-file-1',
    name: 'test-document.pdf',
    size: 1024,
    type: 'application/pdf',
    uploadedAt: new Date().toISOString(),
    accessToken: 'valid-token-123',
    expiryTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxDownloads: 5,
    usedDownloads: 2,
    status: 'active',
    visibility: 'private',
    uploadedBy: 'user-1',
    uploadedByName: 'Test User',
  };

  describe('Token Validation', () => {
    it('should return 404 when file does not exist', () => {
      const file = undefined;
      const token = 'any-token';
      
      const result = validateFileAccess(file, token);
      
      expect(result.statusCode).toBe(404);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('File not found');
    });

    it('should return 403 when token is invalid', () => {
      const token = 'invalid-token';
      
      const result = validateFileAccess(mockFile, token);
      
      expect(result.statusCode).toBe(403);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Invalid access token');
    });

    it('should return 403 when token is missing', () => {
      const token = null;
      
      const result = validateFileAccess(mockFile, token);
      
      expect(result.statusCode).toBe(403);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Invalid access token');
    });

    it('should return 403 when file status is revoked', () => {
      const revokedFile = { ...mockFile, status: 'revoked' as const };
      
      const result = validateFileAccess(revokedFile, mockFile.accessToken);
      
      expect(result.statusCode).toBe(403);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('This link has been revoked');
    });

    it('should return 403 when token is expired', () => {
      const expiredFile = {
        ...mockFile,
        expiryTimestamp: new Date(Date.now() - 1000).toISOString(),
      };
      
      const result = validateFileAccess(expiredFile, mockFile.accessToken);
      
      expect(result.statusCode).toBe(403);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('This link has expired');
    });

    it('should return 403 when download limit is reached', () => {
      const limitReachedFile = {
        ...mockFile,
        maxDownloads: 5,
        usedDownloads: 5,
      };
      
      const result = validateFileAccess(limitReachedFile, mockFile.accessToken);
      
      expect(result.statusCode).toBe(403);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Download limit reached');
    });

    it('should allow access when all validations pass', () => {
      const result = validateFileAccess(mockFile, mockFile.accessToken);
      
      expect(result.statusCode).toBe(200);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Access granted');
    });

    it('should allow unlimited downloads when maxDownloads is 0', () => {
      const unlimitedFile = {
        ...mockFile,
        maxDownloads: 0,
        usedDownloads: 999,
      };
      
      const result = validateFileAccess(unlimitedFile, mockFile.accessToken);
      
      expect(result.statusCode).toBe(200);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Validation Order', () => {
    it('should check file existence before token validation', () => {
      // If file doesn't exist, should return 404 regardless of token
      const result = validateFileAccess(undefined, 'any-token');
      expect(result.statusCode).toBe(404);
    });

    it('should not return 404 for expired files', () => {
      // Expired files should return 403, not 404
      const expiredFile = {
        ...mockFile,
        expiryTimestamp: new Date(Date.now() - 1000).toISOString(),
      };
      
      const result = validateFileAccess(expiredFile, mockFile.accessToken);
      expect(result.statusCode).toBe(403);
      expect(result.statusCode).not.toBe(404);
    });

    it('should not return 404 for revoked files', () => {
      // Revoked files should return 403, not 404
      const revokedFile = { ...mockFile, status: 'revoked' as const };
      
      const result = validateFileAccess(revokedFile, mockFile.accessToken);
      expect(result.statusCode).toBe(403);
      expect(result.statusCode).not.toBe(404);
    });
  });
});

// Helper function to mimic the validation logic in FileAccessPage
function validateFileAccess(
  file: SharedFile | undefined,
  token: string | null
): { allowed: boolean; reason: string; statusCode: number } {
  if (!file) {
    return { allowed: false, reason: 'File not found', statusCode: 404 };
  }

  if (!token || token !== file.accessToken) {
    return { allowed: false, reason: 'Invalid access token', statusCode: 403 };
  }

  if (file.status === 'revoked') {
    return { allowed: false, reason: 'This link has been revoked', statusCode: 403 };
  }

  if (new Date(file.expiryTimestamp).getTime() < Date.now()) {
    return { allowed: false, reason: 'This link has expired', statusCode: 403 };
  }

  if (file.maxDownloads > 0 && file.usedDownloads >= file.maxDownloads) {
    return { allowed: false, reason: 'Download limit reached', statusCode: 403 };
  }

  return { allowed: true, reason: 'Access granted', statusCode: 200 };
}
