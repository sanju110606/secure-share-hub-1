import crypto from 'crypto';

/**
 * Generate a unique access token for file sharing
 */
export function generateAccessToken(): string {
  return 'tk_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a unique filename to avoid conflicts
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  const uuid = crypto.randomUUID();
  return `${uuid}${ext}`;
}
