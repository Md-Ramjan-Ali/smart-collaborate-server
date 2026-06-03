import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TaskService } from './task.service';
import { Role } from '../../../generated/prisma/client';

/**
 * Handle task creation requests
 */
const createTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const { task, warningMessage } = await TaskService.createTask(req.body, userId, role);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: warningMessage || 'Task created successfully!',
    data: {
      task,
      warning: warningMessage || null,
    },
  });
});

/**
 * Handle fetching all tasks list with search, filter, pagination, and sorting
 */
const getAllTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const result = await TaskService.getAllTasks(userId, role, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tasks retrieved successfully!',
    data: result,
  });
});

/**
 * Handle task updates (reassignment, details, status)
 */
const updateTask = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  
  const { task, warningMessage } = await TaskService.updateTask(id, req.body, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: warningMessage || 'Task updated successfully!',
    data: {
      task,
      warning: warningMessage || null,
    },
  });
});

/**
 * Handle task deletion
 */
const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const result = await TaskService.deleteTask(id, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Task deleted successfully!',
    data: result,
  });
});

/**
 * Fetch personal tasks assigned to the logged-in Team Member (grouped by TO_DO & IN_PROGRESS)
 */
const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await TaskService.getMyTasks(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Personal tasks retrieved successfully!',
    data: result,
  });
});

export const TaskController = {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  getMyTasks,
};
