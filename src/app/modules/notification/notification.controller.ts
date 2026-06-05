import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { NotificationService } from './notification.service';

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await NotificationService.getMyNotifications(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notifications retrieved successfully!',
    data: result,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id as string;
  const result = await NotificationService.markAsRead(id, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification marked as read!',
    data: result,
  });
});

export const NotificationController = {
  getMyNotifications,
  markAsRead,
};
