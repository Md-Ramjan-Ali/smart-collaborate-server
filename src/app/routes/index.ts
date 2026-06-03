import { Router } from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { ProjectRoutes } from '../modules/project/project.route';
import { TaskRoutes } from '../modules/task/task.route';
import { DashboardRoutes } from '../modules/dashboard/dashboard.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: UserRoutes,
  },
  {
    path: '/projects',
    route: ProjectRoutes,
  },
  {
    path: '/tasks',
    route: TaskRoutes,
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
];

// Register all modular routes under base path
moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
