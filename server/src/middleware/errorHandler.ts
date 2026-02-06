import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';

interface ErrorWithStatus extends Error {
  status?: number;
  code?: string | number;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (err: ErrorWithStatus, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      error: {
        message: 'File size too large. Maximum size is 50MB.',
        code: 'FILE_TOO_LARGE',
      },
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        message: err.message,
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Duplicate entry. Resource already exists.',
        code: 'DUPLICATE_ENTRY',
      },
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token.',
        code: 'INVALID_TOKEN',
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED',
      },
    });
    return;
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
    },
  });
};
