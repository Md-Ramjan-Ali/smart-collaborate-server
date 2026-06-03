import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import auth from '../../middlewares/auth';

const router = Router();

// Retrieve all dashboard stats, charts, activities, and deadlines
router.get(
  '/meta',
  auth(),
  DashboardController.getDashboardMeta
);

// Retrieve workload summary of members for a specific project
router.get(
  '/workload/:projectId',
  auth(),
  DashboardController.getProjectWorkload
);

export const DashboardRoutes = router;
