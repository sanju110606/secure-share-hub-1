import { Response } from 'express';
import { validationResult } from 'express-validator';
import fs from 'fs';
import { File } from '../models/File';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth';

/**
 * Get admin statistics
 * GET /api/admin/stats
 */
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFiles = await File.countDocuments();
    
    const now = new Date();
    const activeLinks = await File.countDocuments({
      status: 'active',
      expiryTimestamp: { $gt: now },
    });
    
    const expiredLinks = await File.countDocuments({
      $or: [
        { status: 'revoked' },
        { expiryTimestamp: { $lte: now } },
      ],
    });

    const totalDownloads = await Activity.countDocuments({
      eventType: 'download_success',
    });

    const blockedAttempts = await Activity.countDocuments({
      eventType: 'download_blocked',
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalFiles,
          activeLinks,
          expiredLinks,
          totalDownloads,
          blockedAttempts,
        },
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get admin statistics',
        code: 'STATS_ERROR',
      },
    });
  }
};

/**
 * Get all users
 * GET /api/admin/users
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        users: users.map((user) => ({
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get users',
        code: 'GET_USERS_ERROR',
      },
    });
  }
};

/**
 * Get all files
 * GET /api/admin/files
 */
export const getAllFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = await File.find()
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
          uploadedByName: (file.uploadedBy as any).name,
        })),
      },
    });
  } catch (error) {
    console.error('Get all files error:', error);
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
 * Get all activities
 * GET /api/admin/activities
 */
export const getAllActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activities = await Activity.find()
      .populate('fileId', 'originalName')
      .sort({ timestamp: -1 })
      .limit(1000); // Limit to recent activities

    res.json({
      success: true,
      data: {
        activities: activities.map((activity) => ({
          id: activity._id,
          fileId: activity.fileId._id,
          fileName: (activity.fileId as any).originalName || 'Unknown',
          timestamp: activity.timestamp,
          eventType: activity.eventType,
          status: activity.status,
          details: activity.details,
          ipAddress: activity.ipAddress,
        })),
      },
    });
  } catch (error) {
    console.error('Get all activities error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get activities',
        code: 'GET_ACTIVITIES_ERROR',
      },
    });
  }
};

/**
 * Delete any file (admin privilege)
 * DELETE /api/admin/files/:id
 */
export const deleteAnyFile = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const file = await File.findById(req.params.id);

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

/**
 * Change user role
 * PATCH /api/admin/users/:id/role
 */
export const changeUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
      return;
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to change user role',
        code: 'ROLE_CHANGE_ERROR',
      },
    });
  }
};
