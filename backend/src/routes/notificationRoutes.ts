import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getUserNotifications,
  getUserUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', getUserNotifications);
router.get('/unread-count', getUserUnreadCount);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export default router;
