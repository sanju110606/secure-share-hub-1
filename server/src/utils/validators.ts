import { body, param, ValidationChain } from 'express-validator';

export const registerValidation: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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
