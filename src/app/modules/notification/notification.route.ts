import { Router } from 'express';
import { NotificationController } from './notification.controller';
import auth from '../../middlewares/auth';

const router = Router();

// Get My Notifications
router.get(
  '/',
  auth(),
  NotificationController.getMyNotifications
);

// Mark as Read
router.patch(
  '/:id/read',
  auth(),
  NotificationController.markAsRead
);

export const NotificationRoutes = router;
