import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  getAllFiles,
  getAllActivities,
  deleteAnyFile,
  changeUserRole,
} from '../controllers/admin.controller';
import { authenticate, isAdmin } from '../middleware/auth';
import { fileIdValidation, userIdValidation, roleUpdateValidation } from '../utils/validators';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/files', getAllFiles);
router.get('/activities', getAllActivities);
router.delete('/files/:id', fileIdValidation, deleteAnyFile);
router.patch('/users/:id/role', userIdValidation, roleUpdateValidation, changeUserRole);

export default router;
