import { Response } from 'express';
import { validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { File, IFile } from '../models/File';
import { Activity } from '../models/Activity';
import { User, IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { generateAccessToken } from '../utils/tokenGenerator';
import { config } from '../config/config';
import { validateFile, isImage } from '../utils/fileValidation';
import { processUploadedImage } from '../utils/imageProcessor';

/**
 * Upload a new file
 * POST /api/files/upload
 */
export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array(),
        },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded',
          code: 'NO_FILE',
        },
      });
      return;
    }

    if (!req.user) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
      return;
    }

    // Comprehensive file validation
    const fileValidationResult = await validateFile(
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      config.maxFileSize
    );

    if (!fileValidationResult.valid) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      // Log blocked upload attempt
      await Activity.create({
        eventType: 'upload_blocked',
        status: 'blocked',
        details: `File upload blocked: ${fileValidationResult.errors.join(', ')}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      res.status(400).json({
        success: false,
        error: {
          message: 'File validation failed',
          code: 'VALIDATION_FAILED',
          details: fileValidationResult.errors,
        },
      });
      return;
    }

    // Process images (optimize and remove EXIF data)
    if (isImage(req.file.mimetype)) {
      try {
        await processUploadedImage(req.file.path);
        console.log(`Image processed: ${req.file.originalname}`);
      } catch (error) {
        console.error('Image processing error:', error);
        // Continue even if image processing fails
      }
    }

    const { maxDownloads = 0, expiryHours = 24, visibility = 'private' } = req.body;

    // Generate unique access token
    const accessToken = generateAccessToken();

    // Calculate expiry timestamp
    const expiryTimestamp = new Date(Date.now() + parseInt(expiryHours) * 60 * 60 * 1000);

    // Create file record
    const file = new File({
      name: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      path: req.file.path,
      accessToken,
      expiryTimestamp,
      maxDownloads: parseInt(maxDownloads),
      visibility,
      uploadedBy: req.user._id,
    });

    await file.save();

    // Log activity
    await Activity.create({
      fileId: file._id,
      eventType: 'access_attempt',
      status: 'info',
      details: `File "${file.originalName}" uploaded and link generated`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Populate user info
    await file.populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      data: {
        file: {
          id: file._id,
          name: file.originalName,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt,
          accessToken: file.accessToken,
          expiryTimestamp: file.expiryTimestamp,
          maxDownloads: file.maxDownloads,
          usedDownloads: file.usedDownloads,
          status: file.status,
          visibility: file.visibility,
          uploadedBy: file.uploadedBy._id,
          uploadedByName: (file.uploadedBy as unknown as IUser).name,
        },
      },
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to upload file',
        code: 'UPLOAD_ERROR',
      },
    });
  }
};

/**
 * Get all files for authenticated user
 * GET /api/files
 */
export const getUserFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
      return;
    }

    const files = await File.find({ uploadedBy: req.user._id })
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      data: {
        files: files.map((file) => ({
          id: file._id,
          name: file.originalName,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt,
          accessToken: file.accessToken,
          expiryTimestamp: file.expiryTimestamp,
          maxDownloads: file.maxDownloads,
          usedDownloads: file.usedDownloads,
          status: file.status,
          visibility: file.visibility,
          uploadedBy: file.uploadedBy._id,
          uploadedByName: (file.uploadedBy as unknown as IUser).name,
        })),
      },
    });
  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get files',
        code: 'GET_FILES_ERROR',
      },
    });
  }
};

/**
 * Get file by ID
 * GET /api/files/:id
 */
export const getFileById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid file ID',
          code: 'INVALID_FILE_ID',
        },
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
      return;
    }

    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    }).populate('uploadedBy', 'name email');

    if (!file) {
      res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        file: {
          id: file._id,
          name: file.originalName,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt,
          accessToken: file.accessToken,
          expiryTimestamp: file.expiryTimestamp,
          maxDownloads: file.maxDownloads,
          usedDownloads: file.usedDownloads,
          status: file.status,
          visibility: file.visibility,
          uploadedBy: file.uploadedBy._id,
          uploadedByName: (file.uploadedBy as unknown as IUser).name,
        },
      },
    });
  } catch (error) {
    console.error('Get file by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get file',
        code: 'GET_FILE_ERROR',
      },
    });
  }
};

/**
 * Access file by token (validate and return metadata)
 * GET /api/files/access/:token
 */
export const accessFileByToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const file = await File.findOne({ accessToken: token }).populate('uploadedBy', 'name email');

    if (!file) {
      res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      });
      return;
    }

    // Check if file is revoked
    if (file.status === 'revoked') {
      await Activity.create({
        fileId: file._id,
        eventType: 'access_attempt',
        status: 'blocked',
        details: 'Access attempt with revoked token',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'This file link has been revoked',
          code: 'LINK_REVOKED',
        },
      });
      return;
    }

    // Check if file is expired
    if (new Date() > file.expiryTimestamp) {
      await Activity.create({
        fileId: file._id,
        eventType: 'download_blocked',
        status: 'blocked',
        details: 'Download blocked – Token expired',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'This file link has expired',
          code: 'LINK_EXPIRED',
        },
      });
      return;
    }

    // Check download limit
    if (file.maxDownloads > 0 && file.usedDownloads >= file.maxDownloads) {
      await Activity.create({
        fileId: file._id,
        eventType: 'download_blocked',
        status: 'blocked',
        details: 'Download blocked – Limit exceeded',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'Download limit exceeded',
          code: 'LIMIT_EXCEEDED',
        },
      });
      return;
    }

    // Log successful access
    await Activity.create({
      fileId: file._id,
      eventType: 'access_attempt',
      status: 'success',
      details: 'Token validated successfully',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: {
        file: {
          id: file._id,
          name: file.originalName,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt,
          expiryTimestamp: file.expiryTimestamp,
          maxDownloads: file.maxDownloads,
          usedDownloads: file.usedDownloads,
          visibility: file.visibility,
          uploadedByName: (file.uploadedBy as unknown as IUser).name,
        },
      },
    });
  } catch (error) {
    console.error('Access file by token error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to access file',
        code: 'ACCESS_ERROR',
      },
    });
  }
};

/**
 * Download file by token
 * GET /api/files/download/:token
 */
export const downloadFileByToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const file = await File.findOne({ accessToken: token });

    if (!file) {
      res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      });
      return;
    }

    // Check if file is revoked
    if (file.status === 'revoked') {
      await Activity.create({
        fileId: file._id,
        eventType: 'download_blocked',
        status: 'blocked',
        details: 'Download blocked – Link revoked',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'This file link has been revoked',
          code: 'LINK_REVOKED',
        },
      });
      return;
    }

    // Check if file is expired
    if (new Date() > file.expiryTimestamp) {
      await Activity.create({
        fileId: file._id,
        eventType: 'download_blocked',
        status: 'blocked',
        details: 'Download blocked – Token expired',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'This file link has expired',
          code: 'LINK_EXPIRED',
        },
      });
      return;
    }

    // Check download limit
    if (file.maxDownloads > 0 && file.usedDownloads >= file.maxDownloads) {
      await Activity.create({
        fileId: file._id,
        eventType: 'download_blocked',
        status: 'blocked',
        details: 'Download blocked – Limit exceeded',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'Download limit exceeded',
          code: 'LIMIT_EXCEEDED',
        },
      });
      return;
    }

    // Increment download count
    file.usedDownloads += 1;
    await file.save();

    // Log successful download
    await Activity.create({
      fileId: file._id,
      eventType: 'download_success',
      status: 'success',
      details: 'File downloaded successfully',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Stream file to client
    res.download(file.path, file.originalName);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to download file',
        code: 'DOWNLOAD_ERROR',
      },
    });
  }
};

/**
 * Regenerate access token for a file
 * PATCH /api/files/:id/regenerate-token
 */
export const regenerateToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid file ID',
          code: 'INVALID_FILE_ID',
        },
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
      return;
    }

    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!file) {
      res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      });
      return;
    }

    // Generate new token
    const newToken = generateAccessToken();
    file.accessToken = newToken;
    file.status = 'active';
    file.expiryTimestamp = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await file.save();

    // Log activity
    await Activity.create({
      fileId: file._id,
      eventType: 'link_regenerated',
      status: 'info',
      details: 'Access token regenerated by owner',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: {
        file: {
          id: file._id,
          accessToken: file.accessToken,
          expiryTimestamp: file.expiryTimestamp,
          status: file.status,
        },
      },
    });
  } catch (error) {
    console.error('Regenerate token error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to regenerate token',
        code: 'REGENERATE_ERROR',
      },
    });
  }
};

/**
 * Revoke file access
 * PATCH /api/files/:id/revoke
 */
export const revokeFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid file ID',
          code: 'INVALID_FILE_ID',
        },
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
      return;
    }

    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!file) {
      res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      });
      return;
    }

    file.status = 'revoked';
    await file.save();

    // Log activity
    await Activity.create({
      fileId: file._id,
      eventType: 'link_revoked',
      status: 'blocked',
      details: 'Link revoked by file owner',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: {
        file: {
          id: file._id,
          status: file.status,
        },
      },
    });
  } catch (error) {
    console.error('Revoke file error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to revoke file',
        code: 'REVOKE_ERROR',
      },
    });
  }
};

/**
 * Delete a file
 * DELETE /api/files/:id
 */
export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid file ID',
          code: 'INVALID_FILE_ID',
        },
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
      return;
    }

    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!file) {
      res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      });
      return;
    }

    // Delete physical file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete file record
    await File.deleteOne({ _id: file._id });

    // Delete associated activities
    await Activity.deleteMany({ fileId: file._id });

    res.json({
      success: true,
      data: {
        message: 'File deleted successfully',
      },
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete file',
        code: 'DELETE_ERROR',
      },
    });
  }
};
