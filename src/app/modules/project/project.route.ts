import { Router } from 'express';
import { ProjectController } from './project.controller';
import auth from '../../middlewares/auth';
import { Role } from '../../../generated/prisma/client';

const router = Router();

// Create Project (Only ADMIN & Project Managers can create projects)
router.post(
  '/',
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  ProjectController.createProject
);

// Get All Projects (Any authenticated user can fetch their projects list)
router.get(
  '/',
  auth(),
  ProjectController.getAllProjects
);

// Get Single Project Details (Any authenticated member of the project)
router.get(
  '/:id',
  auth(),
  ProjectController.getProjectById
);

// Update Project Details
router.patch(
  '/:id',
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  ProjectController.updateProject
);

// Add Team Member to Project
router.post(
  '/:id/invite',
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  ProjectController.addTeamMember
);

// Delete Project
router.delete(
  '/:id',
  auth(Role.ADMIN, Role.PROJECT_MANAGER),
  ProjectController.deleteProject
);

export const ProjectRoutes = router;
