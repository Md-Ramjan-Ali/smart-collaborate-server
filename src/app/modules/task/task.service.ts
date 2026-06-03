import prisma from '../../lib/db';
import AppError from '../../errors/AppError';
import { Task, TaskStatus, Priority, Role } from '../../../generated/prisma/client';

/**
 * Helper function to check if a user is overloaded (has > 3 active "IN_PROGRESS" tasks)
 */
const checkUserOverload = async (userId: string | null) => {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!user) return null;

  const activeTasksCount = await prisma.task.count({
    where: {
      assigneeId: userId,
      status: 'IN_PROGRESS',
    },
  });

  if (activeTasksCount > 3) {
    return {
      isOverloaded: true,
      warningMessage: `Warning: ${user.name} has ${activeTasksCount} active tasks. Assigning more tasks may impact deadlines.`,
    };
  }

  return { isOverloaded: false, warningMessage: '' };
};

/**
 * Helper to record activity logs
 */
const createActivityLog = async (message: string, userId: string, projectId: string) => {
  return prisma.activityLog.create({
    data: {
      message,
      userId,
      projectId,
    },
  });
};

/**
 * Create a task (Admin & PM only)
 */
const createTask = async (
  payload: {
    title: string;
    description?: string;
    priority?: Priority;
    status?: TaskStatus;
    assigneeId?: string;
    projectId: string;
    dueDate: string;
  },
  userId: string,
  userRole: Role
) => {
  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
    include: { teamMembers: true },
  });

  if (!project) {
    throw new AppError(404, 'Project not found!');
  }

  // Check role authorization (Only ADMIN or project owner/members with PM role)
  if (userRole !== Role.ADMIN && project.ownerId !== userId) {
    throw new AppError(403, 'You do not have permission to create tasks in this project!');
  }

  // 1. Due Date Validation (Task's due date cannot exceed project's end date)
  const taskDueDate = new Date(payload.dueDate);
  const projectEndDate = new Date(project.endDate);

  if (taskDueDate > projectEndDate) {
    throw new AppError(
      400,
      `Task due date cannot be later than the project end date (${project.endDate.toISOString().split('T')[0]}).`
    );
  }

  // Create task
  const result = await prisma.task.create({
    data: {
      title: payload.title,
      description: payload.description,
      priority: payload.priority || 'MEDIUM',
      status: payload.status || 'TO_DO',
      dueDate: taskDueDate,
      project: { connect: { id: payload.projectId } },
      assignee: payload.assigneeId ? { connect: { id: payload.assigneeId } } : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { title: true } },
    },
  });

  // Log activity
  const creator = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const logMessage = `${creator?.name || 'User'} created task '${payload.title}' in Project '${project.title}'`;
  await createActivityLog(logMessage, userId, project.id);

  // 2. Overload warning check
  let warningMessage = '';
  if (payload.assigneeId) {
    const overloadResult = await checkUserOverload(payload.assigneeId);
    if (overloadResult?.isOverloaded) {
      warningMessage = overloadResult.warningMessage;
    }
  }

  return { task: result, warningMessage };
};

/**
 * Get all tasks with search, filters, pagination, and sorting
 */
const getAllTasks = async (
  userId: string,
  role: Role,
  query: {
    projectId?: string;
    priority?: Priority;
    status?: TaskStatus;
    assigneeId?: string;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: string;
    limit?: string;
  }
) => {
  const {
    projectId,
    priority,
    status,
    assigneeId,
    searchTerm,
    sortBy = 'dueDate',
    sortOrder = 'asc',
    page = '1',
    limit = '10',
  } = query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build filters block
  const filterConditions: any = {};

  if (projectId) filterConditions.projectId = projectId;
  if (priority) filterConditions.priority = priority;
  if (status) filterConditions.status = status;
  if (assigneeId) filterConditions.assigneeId = assigneeId;

  if (searchTerm) {
    filterConditions.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  // If user is not Admin, restrict tasks to projects they are part of
  if (role !== Role.ADMIN) {
    filterConditions.project = {
      OR: [
        { ownerId: userId },
        { teamMembers: { some: { id: userId } } },
      ],
    };
  }

  // Retrieve matching tasks
  const tasks = await prisma.task.findMany({
    where: filterConditions,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true, endDate: true } },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limitNum,
  });

  const total = await prisma.task.count({ where: filterConditions });

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: tasks,
  };
};

/**
 * Update a task
 * - ADMIN / PM: Can edit all fields
 * - TEAM_MEMBER: Can ONLY edit status of assigned tasks
 */
const updateTask = async (
  taskId: string,
  payload: Partial<Task>,
  userId: string,
  userRole: Role
) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, title: true, ownerId: true, endDate: true } },
    },
  });

  if (!task) {
    throw new AppError(404, 'Task not found!');
  }

  const { title, description, priority, status, assigneeId, dueDate } = payload;
  const project = task.project;

  let updateData: any = {};
  let warningMessage = '';

  // 1. Permission checks
  if (userRole === Role.TEAM_MEMBER) {
    // Team member can ONLY update status
    if (title || description || priority || assigneeId || dueDate) {
      throw new AppError(403, 'Team members are only allowed to update task status!');
    }

    // Must be assigned to this task
    if (task.assigneeId !== userId) {
      throw new AppError(403, 'You can only update tasks assigned directly to you!');
    }

    updateData.status = status;
  } else {
    // Admin or Project Owner Manager
    const projectDetails = await prisma.project.findUnique({
      where: { id: project.id },
      include: { teamMembers: true },
    });

    if (userRole !== Role.ADMIN && projectDetails?.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to update tasks in this project!');
    }

    // Update payload mappings
    updateData = { ...payload };

    // Due date validation
    if (dueDate) {
      const taskDueDate = new Date(dueDate);
      const projectEndDate = new Date(project.endDate);

      if (taskDueDate > projectEndDate) {
        throw new AppError(
          400,
          `Task due date cannot be later than the project end date (${project.endDate.toISOString().split('T')[0]}).`
        );
      }
      updateData.dueDate = taskDueDate;
    }
  }

  // Update task
  const result = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { title: true } },
    },
  });

  // Log activity
  const updater = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  let logMessage = '';
  
  if (status && status !== task.status) {
    logMessage = `${updater?.name || 'User'} updated status of '${result.title}' to '${status}'`;
  } else {
    logMessage = `${updater?.name || 'User'} updated task '${result.title}' details`;
  }
  
  await createActivityLog(logMessage, userId, project.id);

  // Check overload warning on status change or assignee reassignment
  const targetAssigneeId = assigneeId !== undefined ? assigneeId : result.assigneeId;
  const targetStatus = status !== undefined ? status : result.status;

  if (targetAssigneeId && targetStatus === 'IN_PROGRESS') {
    const overloadResult = await checkUserOverload(targetAssigneeId);
    if (overloadResult?.isOverloaded) {
      warningMessage = overloadResult.warningMessage;
    }
  }

  return { task: result, warningMessage };
};

/**
 * Delete a task (Admin & PM only)
 */
const deleteTask = async (taskId: string, userId: string, userRole: Role) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, title: true, ownerId: true } },
    },
  });

  if (!task) {
    throw new AppError(404, 'Task not found!');
  }

  // Only Admin or PM owner
  if (userRole !== Role.ADMIN && task.project.ownerId !== userId) {
    throw new AppError(403, 'You do not have permission to delete this task!');
  }

  // Log deletion activity before delete
  const deleter = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const logMessage = `${deleter?.name || 'User'} deleted task '${task.title}' in Project '${task.project.title}'`;
  await createActivityLog(logMessage, userId, task.project.id);

  await prisma.task.delete({
    where: { id: taskId },
  });

  return { id: taskId };
};

/**
 * Get personalized tasks list for logged-in Team Member
 * Grouped by "To Do" and "In Progress"
 */
const getMyTasks = async (userId: string) => {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      OR: [
        { status: 'TO_DO' },
        { status: 'IN_PROGRESS' },
      ],
    },
    include: {
      project: { select: { id: true, title: true } },
    },
    orderBy: {
      dueDate: 'asc',
    },
  });

  // Group by status
  const todo = tasks.filter((t) => t.status === 'TO_DO');
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS');

  return {
    todo,
    inProgress,
  };
};

export const TaskService = {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  getMyTasks,
};
