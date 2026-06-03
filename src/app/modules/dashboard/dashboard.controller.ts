import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DashboardService } from './dashboard.service';
import { Role } from '../../../generated/prisma/client';

/**
 * Handle dashboard metadata request
 */
const getDashboardMeta = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const result = await DashboardService.getDashboardMeta(userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard analytics retrieved successfully!',
    data: result,
  });
});

/**
 * Handle request for project workload summaries
 */
const getProjectWorkload = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const result = await DashboardService.getProjectWorkload(projectId, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project workload summary retrieved successfully!',
    data: result,
  });
});

export const DashboardController = {
  getDashboardMeta,
  getProjectWorkload,
};
