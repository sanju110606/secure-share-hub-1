import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';
import { generateUniqueFilename } from '../utils/tokenGenerator';
import { validateMimeType, validateFileExtension, sanitizeFilename } from '../utils/fileValidation';

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize the original filename
    const sanitized = sanitizeFilename(file.originalname);
    const uniqueName = generateUniqueFilename(sanitized);
    cb(null, uniqueName);
  },
});

// File filter - whitelist allowed file types with enhanced validation
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Validate MIME type
  if (!validateMimeType(file.mimetype)) {
    cb(new Error('Invalid file type. Only documents, images, and archives are allowed.'));
    return;
  }
  
  // Validate file extension
  if (!validateFileExtension(file.originalname)) {
    cb(new Error('Invalid file extension. Please upload only allowed file types.'));
    return;
  }
  
  cb(null, true);
};

// Configure multer
export const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize, // 50MB default
    files: 1, // Only allow one file at a time
  },
  fileFilter,
});
