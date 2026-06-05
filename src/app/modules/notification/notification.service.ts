import prisma from '../../lib/db';
import AppError from '../../errors/AppError';

/**
 * Fetch all notifications for the logged-in user
 */
const getMyNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Mark a notification as read
 */
const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError(404, 'Notification not found!');
  }

  if (notification.userId !== userId) {
    throw new AppError(403, 'You do not have permission to modify this notification!');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const NotificationService = {
  getMyNotifications,
  markAsRead,
};
