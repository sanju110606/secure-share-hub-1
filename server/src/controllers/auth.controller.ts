import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/User';
import { AuthRequest, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
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

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: {
          message: 'User with this email already exists',
          code: 'USER_EXISTS',
        },
      });
      return;
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      role: 'user',
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        user: {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to register user',
        code: 'REGISTER_ERROR',
      },
    });
  }
};

/**
 * User login
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
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

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to login',
        code: 'LOGIN_ERROR',
      },
    });
  }
};

/**
 * Admin login
 * POST /api/auth/admin/login
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
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

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid admin credentials',
          code: 'INVALID_ADMIN_CREDENTIALS',
        },
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid admin credentials',
          code: 'INVALID_ADMIN_CREDENTIALS',
        },
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to login',
        code: 'LOGIN_ERROR',
      },
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required',
          code: 'NO_REFRESH_TOKEN',
        },
      });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        },
      });
      return;
    }

    // Generate new access token
    const accessToken = generateAccessToken(decoded.userId);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to refresh token',
        code: 'REFRESH_ERROR',
      },
    });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
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

    res.json({
      success: true,
      data: {
        user: {
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
        },
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user',
        code: 'GET_USER_ERROR',
      },
    });
  }
};

/**
 * Logout (optional - client-side token removal)
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  // In a stateless JWT system, logout is primarily handled client-side
  // by removing the tokens. This endpoint can be used for logging purposes
  // or if implementing a token blacklist.
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
};
