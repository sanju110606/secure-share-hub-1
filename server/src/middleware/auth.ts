import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token. User not found.',
          code: 'INVALID_TOKEN',
        },
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired token.',
        code: 'TOKEN_INVALID',
      },
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      },
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        message: 'Access denied. Admin privileges required.',
        code: 'ADMIN_REQUIRED',
      },
    });
    return;
  }

  next();
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpire });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpire });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
  } catch (error) {
    return null;
  }
};
