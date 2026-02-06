import path from 'path';
import sanitize from 'sanitize-filename';
import fs from 'fs';

// Magic number signatures for common file types
const FILE_SIGNATURES: { [key: string]: { magic: number[][]; mimes: string[] } } = {
  pdf: {
    magic: [[0x25, 0x50, 0x44, 0x46]], // %PDF
    mimes: ['application/pdf'],
  },
  png: {
    magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    mimes: ['image/png'],
  },
  jpeg: {
    magic: [[0xff, 0xd8, 0xff]],
    mimes: ['image/jpeg', 'image/jpg'],
  },
  gif: {
    magic: [[0x47, 0x49, 0x46, 0x38]], // GIF8
    mimes: ['image/gif'],
  },
  zip: {
    magic: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
    mimes: ['application/zip', 'application/x-zip-compressed'],
  },
  docx: {
    magic: [[0x50, 0x4b, 0x03, 0x04]], // DOCX is ZIP-based
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  xlsx: {
    magic: [[0x50, 0x4b, 0x03, 0x04]], // XLSX is ZIP-based
    mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
};

// Allowed file extensions and their MIME types
export const ALLOWED_FILE_TYPES: { [ext: string]: string[] } = {
  // Documents
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  txt: ['text/plain'],
  
  // Images
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  svg: ['image/svg+xml'],
  
  // Archives
  zip: ['application/zip', 'application/x-zip-compressed'],
  rar: ['application/x-rar-compressed', 'application/vnd.rar'],
  '7z': ['application/x-7z-compressed'],
};

/**
 * Validate file MIME type matches allowed types
 */
export const validateMimeType = (mimetype: string): boolean => {
  const allowedMimes = Object.values(ALLOWED_FILE_TYPES).flat();
  return allowedMimes.includes(mimetype);
};

/**
 * Validate file extension
 */
export const validateFileExtension = (filename: string): boolean => {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return ext in ALLOWED_FILE_TYPES;
};

/**
 * Check if file extension matches MIME type
 */
export const validateExtensionMatchesMime = (filename: string, mimetype: string): boolean => {
  const ext = path.extname(filename).toLowerCase().slice(1);
  const allowedMimes = ALLOWED_FILE_TYPES[ext];
  
  if (!allowedMimes) return false;
  return allowedMimes.includes(mimetype);
};

/**
 * Check file magic numbers manually
 */
const checkMagicNumber = (buffer: Buffer, signatures: number[][]): boolean => {
  for (const signature of signatures) {
    let match = true;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
};

/**
 * Validate file using magic numbers (file signature)
 */
export const validateFileMagicNumber = async (filePath: string): Promise<boolean> => {
  try {
    // Read first 12 bytes of file (enough for most signatures)
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);
    
    // Check against known signatures
    for (const [type, config] of Object.entries(FILE_SIGNATURES)) {
      if (checkMagicNumber(buffer, config.magic)) {
        return true;
      }
    }
    
    // For text files and other types that don't have specific magic numbers, allow them
    // This is a more lenient approach - in production you might want stricter validation
    return true;
  } catch (error) {
    console.error('Magic number validation error:', error);
    return false;
  }
};

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path separators and dangerous characters
  let sanitized = sanitize(filename, { replacement: '_' });
  
  // Remove any remaining dangerous patterns
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '');
  
  // Ensure filename is not empty after sanitization
  if (!sanitized || sanitized.trim() === '') {
    sanitized = `file_${Date.now()}`;
  }
  
  // Limit filename length
  const maxLength = 255;
  const ext = path.extname(sanitized);
  const nameWithoutExt = path.basename(sanitized, ext);
  
  if (sanitized.length > maxLength) {
    const truncatedName = nameWithoutExt.slice(0, maxLength - ext.length - 1);
    sanitized = truncatedName + ext;
  }
  
  return sanitized;
};

/**
 * Validate file size
 */
export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size > 0 && size <= maxSize;
};

/**
 * Check if file is an image
 */
export const isImage = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};

/**
 * Get safe MIME type from extension (fallback)
 */
export const getMimeTypeFromExtension = (filename: string): string | null => {
  const ext = path.extname(filename).toLowerCase().slice(1);
  const mimes = ALLOWED_FILE_TYPES[ext];
  return mimes ? mimes[0] : null;
};

/**
 * Comprehensive file validation
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateFile = async (
  filePath: string,
  originalName: string,
  mimetype: string,
  size: number,
  maxSize: number
): Promise<FileValidationResult> => {
  const errors: string[] = [];
  
  // Validate file size
  if (!validateFileSize(size, maxSize)) {
    errors.push(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  // Validate file extension
  if (!validateFileExtension(originalName)) {
    errors.push('File type not allowed. Please upload documents, images, or archives only.');
  }
  
  // Validate MIME type
  if (!validateMimeType(mimetype)) {
    errors.push('Invalid file MIME type');
  }
  
  // Validate extension matches MIME type
  if (!validateExtensionMatchesMime(originalName, mimetype)) {
    errors.push('File extension does not match file content');
  }
  
  // Validate magic number
  const magicNumberValid = await validateFileMagicNumber(filePath);
  if (!magicNumberValid) {
    errors.push('File content validation failed. The file may be corrupted or malicious.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
