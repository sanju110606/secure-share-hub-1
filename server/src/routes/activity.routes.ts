import express from 'express';
import { getUserActivities, getFileActivities } from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth';
import { fileIdValidation } from '../utils/validators';

const router = express.Router();

router.get('/', authenticate, getUserActivities);
router.get('/:fileId', authenticate, fileIdValidation, getFileActivities);

export default router;
