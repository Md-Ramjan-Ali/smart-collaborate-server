import prisma from '../../lib/db';
import AppError from '../../errors/AppError';
import { Role, ProjectStatus, TaskStatus } from '../../../generated/prisma/client';

/**
 * Fetch general dashboard analytics and KPIs
 */
const getDashboardMeta = async (userId: string, role: Role) => {
  // Define project filter query based on role
  const projectFilter: any = {};
  if (role !== Role.ADMIN) {
    projectFilter.OR = [
      { ownerId: userId },
      { teamMembers: { some: { id: userId } } },
    ];
  }

  // 1. Projects KPIs
  const totalProjects = await prisma.project.count({ where: projectFilter });
  const activeProjects = await prisma.project.count({
    where: { ...projectFilter, status: 'IN_PROGRESS' },
  });
  const completedProjects = await prisma.project.count({
    where: { ...projectFilter, status: 'COMPLETED' },
  });

  // Define task filter query based on role
  const taskFilter: any = {};
  if (role !== Role.ADMIN) {
    taskFilter.project = {
      OR: [
        { ownerId: userId },
        { teamMembers: { some: { id: userId } } },
      ],
    };
  }

  // 2. Tasks KPIs
  const totalTasks = await prisma.task.count({ where: taskFilter });
  const completedTasks = await prisma.task.count({
    where: { ...taskFilter, status: 'COMPLETED' },
  });
  const pendingTasks = totalTasks - completedTasks;

  // 3. Task Status Distribution
  const todoTasks = await prisma.task.count({ where: { ...taskFilter, status: 'TO_DO' } });
  const inProgressTasks = await prisma.task.count({ where: { ...taskFilter, status: 'IN_PROGRESS' } });
  const underReviewTasks = await prisma.task.count({ where: { ...taskFilter, status: 'UNDER_REVIEW' } });

  const statusDistribution = [
    { name: 'To Do', value: todoTasks },
    { name: 'In Progress', value: inProgressTasks },
    { name: 'Under Review', value: underReviewTasks },
    { name: 'Completed', value: completedTasks },
  ];

  // 4. Project Progress Percentages (Percentage bar)
  const projects = await prisma.project.findMany({
    where: projectFilter,
    select: {
      id: true,
      title: true,
      status: true,
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  const projectProgress = await Promise.all(
    projects.map(async (p) => {
      const completedCount = await prisma.task.count({
        where: { projectId: p.id, status: 'COMPLETED' },
      });
      const totalCount = p._count.tasks;
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        id: p.id,
        title: p.title,
        status: p.status,
        totalTasks: totalCount,
        completedTasks: completedCount,
        progress: percentage,
      };
    })
  );

  // 5. Upcoming Deadlines (Tasks due in next 48 hours)
  const now = new Date();
  const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const upcomingTasks = await prisma.task.findMany({
    where: {
      ...taskFilter,
      dueDate: {
        gte: now,
        lte: fortyEightHoursLater,
      },
      status: { not: 'COMPLETED' }, // Don't show completed tasks with near deadlines
    },
    include: {
      project: { select: { title: true } },
      assignee: { select: { name: true, email: true } },
    },
    orderBy: {
      dueDate: 'asc',
    },
  });

  // 6. Recent Activity Feed (Last 10 logs)
  const activityLogsFilter: any = {};
  if (role !== Role.ADMIN) {
    activityLogsFilter.projectId = {
      in: projects.map((p) => p.id),
    };
  }

  const recentActivities = await prisma.activityLog.findMany({
    where: activityLogsFilter,
    include: {
      user: { select: { name: true, email: true } },
      project: { select: { title: true } },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  return {
    kpis: {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
      },
    },
    statusDistribution,
    projectProgress,
    upcomingTasks,
    recentActivities,
  };
};

/**
 * Fetch workload summary for all team members in a specific project
 */
const getProjectWorkload = async (projectId: string, userId: string, role: Role) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      teamMembers: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!project) {
    throw new AppError(404, 'Project not found!');
  }

  // Access check
  if (role !== Role.ADMIN && project.ownerId !== userId) {
    const isMember = project.teamMembers.some((m) => m.id === userId);
    if (!isMember) {
      throw new AppError(403, 'You do not have permission to access this workload data!');
    }
  }

  // Include the owner as part of potential workers, along with members
  const workers = [
    { id: project.owner.id, name: project.owner.name, email: project.owner.email, role: Role.PROJECT_MANAGER },
    ...project.teamMembers.map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role as Role })),
  ];

  // Count workload details for each member/manager in this project
  const workloads = await Promise.all(
    workers.map(async (worker) => {
      const totalTasks = await prisma.task.count({
        where: { projectId, assigneeId: worker.id },
      });

      const activeTasks = await prisma.task.count({
        where: { projectId, assigneeId: worker.id, status: 'IN_PROGRESS' },
      });

      const completedTasks = await prisma.task.count({
        where: { projectId, assigneeId: worker.id, status: 'COMPLETED' },
      });

      return {
        member: worker,
        totalTasks,
        activeTasks,
        completedTasks,
      };
    })
  );

  return workloads;
};

export const DashboardService = {
  getDashboardMeta,
  getProjectWorkload,
};
