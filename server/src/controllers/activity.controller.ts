import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Activity } from '../models/Activity';
import { File } from '../models/File';
import { AuthRequest } from '../middleware/auth';

/**
 * Get activities for authenticated user's files
 * GET /api/activities
 */
export const getUserActivities = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Get all files uploaded by user
    const userFiles = await File.find({ uploadedBy: req.user._id });
    const fileIds = userFiles.map((file) => file._id);

    // Get activities for those files
    const activities = await Activity.find({ fileId: { $in: fileIds } })
      .populate('fileId', 'originalName')
      .sort({ timestamp: -1 })
      .limit(500);

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
        })),
      },
    });
  } catch (error) {
    console.error('Get user activities error:', error);
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
 * Get activities for a specific file
 * GET /api/activities/:fileId
 */
export const getFileActivities = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Verify file belongs to user
    const file = await File.findOne({
      _id: req.params.fileId,
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

    // Get activities for the file
    const activities = await Activity.find({ fileId: file._id })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        activities: activities.map((activity) => ({
          id: activity._id,
          fileId: activity.fileId,
          timestamp: activity.timestamp,
          eventType: activity.eventType,
          status: activity.status,
          details: activity.details,
        })),
      },
    });
  } catch (error) {
    console.error('Get file activities error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get file activities',
        code: 'GET_FILE_ACTIVITIES_ERROR',
      },
    });
  }
};
