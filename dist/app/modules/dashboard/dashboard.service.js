"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const db_1 = __importDefault(require("../../lib/db"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../generated/prisma/client");
/**
 * Fetch general dashboard analytics and KPIs
 */
const getDashboardMeta = async (userId, role) => {
    // Define project filter query based on role
    const projectFilter = {};
    if (role !== client_1.Role.ADMIN) {
        projectFilter.OR = [
            { ownerId: userId },
            { teamMembers: { some: { id: userId } } },
        ];
    }
    // 1. Projects KPIs
    const totalProjects = await db_1.default.project.count({ where: projectFilter });
    const activeProjects = await db_1.default.project.count({
        where: { ...projectFilter, status: 'IN_PROGRESS' },
    });
    const completedProjects = await db_1.default.project.count({
        where: { ...projectFilter, status: 'COMPLETED' },
    });
    // Define task filter query based on role
    const taskFilter = {};
    if (role !== client_1.Role.ADMIN) {
        taskFilter.project = {
            OR: [
                { ownerId: userId },
                { teamMembers: { some: { id: userId } } },
            ],
        };
    }
    // 2. Tasks KPIs
    const totalTasks = await db_1.default.task.count({ where: taskFilter });
    const completedTasks = await db_1.default.task.count({
        where: { ...taskFilter, status: 'COMPLETED' },
    });
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = await db_1.default.task.count({
        where: {
            ...taskFilter,
            dueDate: {
                lt: new Date(),
            },
            status: {
                not: 'COMPLETED',
            },
        },
    });
    // 3. Task Status Distribution
    const todoTasks = await db_1.default.task.count({ where: { ...taskFilter, status: 'TO_DO' } });
    const inProgressTasks = await db_1.default.task.count({ where: { ...taskFilter, status: 'IN_PROGRESS' } });
    const underReviewTasks = await db_1.default.task.count({ where: { ...taskFilter, status: 'UNDER_REVIEW' } });
    const statusDistribution = [
        { name: 'To Do', value: todoTasks },
        { name: 'In Progress', value: inProgressTasks },
        { name: 'Under Review', value: underReviewTasks },
        { name: 'Completed', value: completedTasks },
    ];
    // 4. Project Progress Percentages (Percentage bar)
    const projects = await db_1.default.project.findMany({
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
    const projectProgress = await Promise.all(projects.map(async (p) => {
        const completedCount = await db_1.default.task.count({
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
    }));
    // 5. Upcoming Deadlines (Tasks due in next 48 hours)
    const now = new Date();
    const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const upcomingTasks = await db_1.default.task.findMany({
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
    const activityLogsFilter = {};
    if (role !== client_1.Role.ADMIN) {
        activityLogsFilter.projectId = {
            in: projects.map((p) => p.id),
        };
    }
    const recentActivities = await db_1.default.activityLog.findMany({
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
                overdue: overdueTasks,
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
const getProjectWorkload = async (projectId, userId, role) => {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            teamMembers: { select: { id: true, name: true, email: true, role: true } },
        },
    });
    if (!project) {
        throw new AppError_1.default(404, 'Project not found!');
    }
    // Access check
    if (role !== client_1.Role.ADMIN && project.ownerId !== userId) {
        const isMember = project.teamMembers.some((m) => m.id === userId);
        if (!isMember) {
            throw new AppError_1.default(403, 'You do not have permission to access this workload data!');
        }
    }
    // Include the owner as part of potential workers, along with members
    const workers = [
        { id: project.owner.id, name: project.owner.name, email: project.owner.email, role: client_1.Role.PROJECT_MANAGER },
        ...project.teamMembers.map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role })),
    ];
    // Count workload details for each member/manager in this project
    const workloads = await Promise.all(workers.map(async (worker) => {
        const totalTasks = await db_1.default.task.count({
            where: { projectId, assigneeId: worker.id },
        });
        const activeTasks = await db_1.default.task.count({
            where: { projectId, assigneeId: worker.id, status: 'IN_PROGRESS' },
        });
        const completedTasks = await db_1.default.task.count({
            where: { projectId, assigneeId: worker.id, status: 'COMPLETED' },
        });
        return {
            member: worker,
            totalTasks,
            activeTasks,
            completedTasks,
        };
    }));
    return workloads;
};
exports.DashboardService = {
    getDashboardMeta,
    getProjectWorkload,
};
