import { body, param, ValidationChain } from 'express-validator';

// Password strength validation helper
export const isStrongPassword = (password: string): boolean => {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character, and no spaces
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/])(?!.*\s)[A-Za-z\d@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]{8,}$/;
  return strongPasswordRegex.test(password);
};

export const registerValidation: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .custom((password) => {
      if (!isStrongPassword(password)) {
        throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
      }
      return true;
    }),
  body('name').trim().notEmpty().withMessage('Name is required'),
];

export const loginValidation: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const uploadFileValidation: ValidationChain[] = [
  body('maxDownloads').optional().isInt({ min: 0 }).withMessage('maxDownloads must be a non-negative integer'),
  body('expiryHours').optional().isInt({ min: 1 }).withMessage('expiryHours must be at least 1'),
  body('visibility').optional().isIn(['public', 'private']).withMessage('visibility must be public or private'),
];

export const fileIdValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid file ID'),
];

export const tokenValidation: ValidationChain[] = [
  param('token').notEmpty().withMessage('Token is required'),
];

export const userIdValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid user ID'),
];

export const roleUpdateValidation: ValidationChain[] = [
  body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin'),
];

export const requestPasswordResetValidation: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

export const resetPasswordValidation: ValidationChain[] = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .custom((password) => {
      if (!isStrongPassword(password)) {
        throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
      }
      return true;
    }),
];
