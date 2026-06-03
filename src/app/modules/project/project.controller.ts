import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProjectService } from './project.service';
import { Role } from '../../../generated/prisma/client';

/**
 * Handle request for creating a new project
 */
const createProject = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await ProjectService.createProject(req.body, userId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Project created successfully!',
    data: result,
  });
});

/**
 * Handle request for fetching all projects of the logged-in user
 */
const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const result = await ProjectService.getAllProjects(userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Projects retrieved successfully!',
    data: result,
  });
});

/**
 * Handle request for fetching a single project by ID
 */
const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const result = await ProjectService.getProjectById(id, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project details retrieved successfully!',
    data: result,
  });
});

/**
 * Handle request for updating project metadata
 */
const updateProject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const result = await ProjectService.updateProject(id, req.body, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project updated successfully!',
    data: result,
  });
});

/**
 * Handle request for adding/inviting a team member to a project
 */
const addTeamMember = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; // project ID
  const { memberId } = req.body;
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const result = await ProjectService.addTeamMember(id, memberId, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Team member added successfully!',
    data: result,
  });
});

/**
 * Handle request for deleting a project
 */
const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id as string;
  const role = req.user?.role as Role;
  const result = await ProjectService.deleteProject(id, userId, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Project deleted successfully!',
    data: result,
  });
});

export const ProjectController = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  addTeamMember,
  deleteProject,
};
