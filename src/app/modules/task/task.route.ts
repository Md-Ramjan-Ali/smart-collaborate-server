import { Router } from 'express';
import { TaskController } from './task.controller';
import auth from '../../middlewares/auth';
import { Role } from '../../../generated/prisma/client';

const router = Router();

// Create Task (Only ADMIN & Project Managers can create tasks)
router.post(
  '/',
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  TaskController.createTask
);

// Get All Tasks (Filters by query param, accessible by any logged-in user)
router.get(
  '/',
  auth(),
  TaskController.getAllTasks
);

// Get My Tasks (Personal view for Team Members to see assigned tasks)
router.get(
  '/my-tasks',
  auth(),
  TaskController.getMyTasks
);

// Update Task details (Any role can hit, but Team Member role is restricted to status-only in service)
router.patch(
  '/:id',
  auth(),
  TaskController.updateTask
);

// Delete Task (Only ADMIN & Project Managers)
router.delete(
  '/:id',
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  TaskController.deleteTask
);

// Comments endpoints (Any logged-in user can view/create comments)
router.post(
  '/:id/comments',
  auth(),
  TaskController.createComment
);
router.get(
  '/:id/comments',
  auth(),
  TaskController.getComments
);

// Attachments endpoints (Any logged-in user can view/create attachments)
router.post(
  '/:id/attachments',
  auth(),
  TaskController.createAttachment
);
router.get(
  '/:id/attachments',
  auth(),
  TaskController.getAttachments
);

export const TaskRoutes = router;
