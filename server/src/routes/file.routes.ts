import express from 'express';
import {
  uploadFile,
  getUserFiles,
  getFileById,
  accessFileByToken,
  downloadFileByToken,
  regenerateToken,
  revokeFile,
  deleteFile,
} from '../controllers/file.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadRateLimiter, downloadRateLimiter } from '../middleware/rateLimiter';
import { uploadFileValidation, fileIdValidation, tokenValidation } from '../utils/validators';

const router = express.Router();

// Apply rate limiting to upload and download endpoints
router.post('/upload', uploadRateLimiter, authenticate, upload.single('file'), uploadFileValidation, uploadFile);
router.get('/', authenticate, getUserFiles);
router.get('/access/:token', tokenValidation, accessFileByToken);
router.get('/download/:token', downloadRateLimiter, tokenValidation, downloadFileByToken);
router.get('/:id', authenticate, fileIdValidation, getFileById);
router.patch('/:id/regenerate-token', authenticate, fileIdValidation, regenerateToken);
router.patch('/:id/revoke', authenticate, fileIdValidation, revokeFile);
router.delete('/:id', authenticate, fileIdValidation, deleteFile);

export default router;
