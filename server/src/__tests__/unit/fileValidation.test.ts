import {
  validateMimeType,
  validateFileExtension,
  validateExtensionMatchesMime,
  sanitizeFilename,
  validateFileSize,
  isImage,
  getMimeTypeFromExtension,
} from '../../utils/fileValidation';

describe('File Validation Utilities', () => {
  describe('validateMimeType', () => {
    it('should accept valid MIME types', () => {
      expect(validateMimeType('application/pdf')).toBe(true);
      expect(validateMimeType('image/jpeg')).toBe(true);
      expect(validateMimeType('image/png')).toBe(true);
      expect(validateMimeType('application/zip')).toBe(true);
    });
    
    it('should reject invalid MIME types', () => {
      expect(validateMimeType('application/x-executable')).toBe(false);
      expect(validateMimeType('application/x-msdownload')).toBe(false);
      expect(validateMimeType('text/x-php')).toBe(false);
    });
  });
  
  describe('validateFileExtension', () => {
    it('should accept valid file extensions', () => {
      expect(validateFileExtension('document.pdf')).toBe(true);
      expect(validateFileExtension('image.jpg')).toBe(true);
      expect(validateFileExtension('photo.png')).toBe(true);
      expect(validateFileExtension('archive.zip')).toBe(true);
    });
    
    it('should reject invalid file extensions', () => {
      expect(validateFileExtension('script.exe')).toBe(false);
      expect(validateFileExtension('malware.bat')).toBe(false);
      expect(validateFileExtension('virus.scr')).toBe(false);
    });
    
    it('should be case insensitive', () => {
      expect(validateFileExtension('document.PDF')).toBe(true);
      expect(validateFileExtension('IMAGE.JPG')).toBe(true);
    });
  });
  
  describe('validateExtensionMatchesMime', () => {
    it('should validate matching extensions and MIME types', () => {
      expect(validateExtensionMatchesMime('document.pdf', 'application/pdf')).toBe(true);
      expect(validateExtensionMatchesMime('image.jpg', 'image/jpeg')).toBe(true);
      expect(validateExtensionMatchesMime('photo.png', 'image/png')).toBe(true);
    });
    
    it('should reject mismatched extensions and MIME types', () => {
      expect(validateExtensionMatchesMime('document.pdf', 'image/jpeg')).toBe(false);
      expect(validateExtensionMatchesMime('image.jpg', 'application/pdf')).toBe(false);
      expect(validateExtensionMatchesMime('fake.exe', 'application/pdf')).toBe(false);
    });
  });
  
  describe('sanitizeFilename', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeFilename('../../etc/passwd')).not.toContain('..');
      expect(sanitizeFilename('file<script>alert(1)</script>.txt')).not.toContain('<');
      expect(sanitizeFilename('file|pipe.txt')).not.toContain('|');
    });
    
    it('should handle path traversal attempts', () => {
      const sanitized = sanitizeFilename('../../../etc/passwd');
      expect(sanitized).not.toContain('../');
    });
    
    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });
    
    it('should preserve valid filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('my file with spaces.txt')).toBe('my file with spaces.txt');
    });
  });
  
  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      expect(validateFileSize(1024, 2048)).toBe(true);
      expect(validateFileSize(1000000, 10000000)).toBe(true);
    });
    
    it('should reject files over size limit', () => {
      expect(validateFileSize(3000, 2048)).toBe(false);
      expect(validateFileSize(20000000, 10000000)).toBe(false);
    });
    
    it('should reject zero or negative sizes', () => {
      expect(validateFileSize(0, 1024)).toBe(false);
      expect(validateFileSize(-100, 1024)).toBe(false);
    });
  });
  
  describe('isImage', () => {
    it('should identify image MIME types', () => {
      expect(isImage('image/jpeg')).toBe(true);
      expect(isImage('image/png')).toBe(true);
      expect(isImage('image/gif')).toBe(true);
      expect(isImage('image/webp')).toBe(true);
    });
    
    it('should reject non-image MIME types', () => {
      expect(isImage('application/pdf')).toBe(false);
      expect(isImage('text/plain')).toBe(false);
      expect(isImage('application/zip')).toBe(false);
    });
  });
  
  describe('getMimeTypeFromExtension', () => {
    it('should return MIME type for valid extensions', () => {
      expect(getMimeTypeFromExtension('document.pdf')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('image.jpg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('photo.png')).toBe('image/png');
    });
    
    it('should return null for invalid extensions', () => {
      expect(getMimeTypeFromExtension('script.exe')).toBeNull();
      expect(getMimeTypeFromExtension('malware.bat')).toBeNull();
    });
  });
});
