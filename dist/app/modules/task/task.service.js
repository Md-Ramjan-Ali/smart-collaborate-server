"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const db_1 = __importDefault(require("../../lib/db"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../generated/prisma/client");
/**
 * Helper function to check if a user is overloaded (has > 3 active "IN_PROGRESS" tasks)
 */
const checkUserOverload = async (userId) => {
    if (!userId)
        return null;
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        select: { name: true },
    });
    if (!user)
        return null;
    const activeTasksCount = await db_1.default.task.count({
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
const createActivityLog = async (message, userId, projectId) => {
    return db_1.default.activityLog.create({
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
const createTask = async (payload, userId, userRole) => {
    const project = await db_1.default.project.findUnique({
        where: { id: payload.projectId },
        include: { teamMembers: true },
    });
    if (!project) {
        throw new AppError_1.default(404, 'Project not found!');
    }
    // Check role authorization (Only ADMIN or project owner/members with PM role)
    if (userRole !== client_1.Role.ADMIN && project.ownerId !== userId) {
        throw new AppError_1.default(403, 'You do not have permission to create tasks in this project!');
    }
    // 1. Title uniqueness check within the same project
    const duplicateTask = await db_1.default.task.findFirst({
        where: {
            projectId: payload.projectId,
            title: { equals: payload.title, mode: 'insensitive' },
        },
    });
    if (duplicateTask) {
        throw new AppError_1.default(400, 'This task already exists in the project.');
    }
    // 2. Prevent past dates as deadlines
    const taskDueDate = new Date(payload.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (taskDueDate < today) {
        throw new AppError_1.default(400, 'Please select a valid deadline.');
    }
    // 3. Due Date Validation (Task's due date cannot exceed project's end date)
    const projectEndDate = new Date(project.endDate);
    if (taskDueDate > projectEndDate) {
        throw new AppError_1.default(400, `Task due date cannot be later than the project end date (${project.endDate.toISOString().split('T')[0]}).`);
    }
    // Create task
    const result = await db_1.default.task.create({
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
    const creator = await db_1.default.user.findUnique({ where: { id: userId }, select: { name: true } });
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
const getAllTasks = async (userId, role, query) => {
    const { projectId, priority, status, assigneeId, searchTerm, sortBy = 'dueDate', sortOrder = 'asc', page = '1', limit = '10', } = query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Build filters block
    const filterConditions = {};
    if (projectId)
        filterConditions.projectId = projectId;
    if (priority)
        filterConditions.priority = priority;
    if (status)
        filterConditions.status = status;
    if (assigneeId)
        filterConditions.assigneeId = assigneeId;
    if (searchTerm) {
        filterConditions.OR = [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }
    // If user is not Admin, restrict tasks to projects they are part of
    if (role !== client_1.Role.ADMIN) {
        filterConditions.project = {
            OR: [
                { ownerId: userId },
                { teamMembers: { some: { id: userId } } },
            ],
        };
    }
    // Retrieve matching tasks
    const tasks = await db_1.default.task.findMany({
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
    const total = await db_1.default.task.count({ where: filterConditions });
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
const updateTask = async (taskId, payload, userId, userRole) => {
    const task = await db_1.default.task.findUnique({
        where: { id: taskId },
        include: {
            project: { select: { id: true, title: true, ownerId: true, endDate: true } },
        },
    });
    if (!task) {
        throw new AppError_1.default(404, 'Task not found!');
    }
    const { title, description, priority, status, assigneeId, dueDate } = payload;
    const project = task.project;
    let updateData = {};
    let warningMessage = '';
    // 1. Permission checks
    if (userRole === client_1.Role.TEAM_MEMBER) {
        // Team member can ONLY update status
        if (title || description || priority || assigneeId || dueDate) {
            throw new AppError_1.default(403, 'Team members are only allowed to update task status!');
        }
        // Must be assigned to this task
        if (task.assigneeId !== userId) {
            throw new AppError_1.default(403, 'You can only update tasks assigned directly to you!');
        }
        updateData.status = status;
    }
    else {
        // Admin or Project Owner Manager
        const projectDetails = await db_1.default.project.findUnique({
            where: { id: project.id },
            include: { teamMembers: true },
        });
        if (userRole !== client_1.Role.ADMIN && projectDetails?.ownerId !== userId) {
            throw new AppError_1.default(403, 'You do not have permission to update tasks in this project!');
        }
        // Prevent assigning completed tasks
        if (task.status === 'COMPLETED' && assigneeId !== undefined && assigneeId !== task.assigneeId) {
            throw new AppError_1.default(400, 'Completed tasks cannot be reassigned.');
        }
        // Title uniqueness check within the same project
        if (title && title.toLowerCase() !== task.title.toLowerCase()) {
            const duplicateTask = await db_1.default.task.findFirst({
                where: {
                    projectId: task.projectId,
                    title: { equals: title, mode: 'insensitive' },
                },
            });
            if (duplicateTask) {
                throw new AppError_1.default(400, 'This task already exists in the project.');
            }
        }
        // Update payload mappings
        updateData = { ...payload };
        // Due date validation
        if (dueDate) {
            const taskDueDate = new Date(dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (taskDueDate < today) {
                throw new AppError_1.default(400, 'Please select a valid deadline.');
            }
            const projectEndDate = new Date(project.endDate);
            if (taskDueDate > projectEndDate) {
                throw new AppError_1.default(400, `Task due date cannot be later than the project end date (${project.endDate.toISOString().split('T')[0]}).`);
            }
            updateData.dueDate = taskDueDate;
        }
    }
    // Update task
    const result = await db_1.default.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
            assignee: { select: { id: true, name: true, email: true } },
            project: { select: { title: true } },
        },
    });
    // Log activity
    const updater = await db_1.default.user.findUnique({ where: { id: userId }, select: { name: true } });
    let logMessage = '';
    if (status && status !== task.status) {
        logMessage = `${updater?.name || 'User'} updated status of '${result.title}' to '${status}'`;
    }
    else {
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
const deleteTask = async (taskId, userId, userRole) => {
    const task = await db_1.default.task.findUnique({
        where: { id: taskId },
        include: {
            project: { select: { id: true, title: true, ownerId: true } },
        },
    });
    if (!task) {
        throw new AppError_1.default(404, 'Task not found!');
    }
    // Only Admin or PM owner
    if (userRole !== client_1.Role.ADMIN && task.project.ownerId !== userId) {
        throw new AppError_1.default(403, 'You do not have permission to delete this task!');
    }
    // Log deletion activity before delete
    const deleter = await db_1.default.user.findUnique({ where: { id: userId }, select: { name: true } });
    const logMessage = `${deleter?.name || 'User'} deleted task '${task.title}' in Project '${task.project.title}'`;
    await createActivityLog(logMessage, userId, task.project.id);
    await db_1.default.task.delete({
        where: { id: taskId },
    });
    return { id: taskId };
};
/**
 * Get personalized tasks list for logged-in Team Member
 * Grouped by "To Do" and "In Progress"
 */
const getMyTasks = async (userId) => {
    const tasks = await db_1.default.task.findMany({
        where: {
            assigneeId: userId,
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
    const underReview = tasks.filter((t) => t.status === 'UNDER_REVIEW');
    const completed = tasks.filter((t) => t.status === 'COMPLETED');
    return {
        todo,
        inProgress,
        underReview,
        completed,
    };
};
/**
 * Add a comment to a task
 */
const createComment = async (taskId, content, userId) => {
    const task = await db_1.default.task.findUnique({
        where: { id: taskId },
        include: { project: { select: { title: true } } },
    });
    if (!task) {
        throw new AppError_1.default(404, 'Task not found!');
    }
    const comment = await db_1.default.comment.create({
        data: {
            content,
            taskId,
            userId,
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });
    // Notify assignee if someone else comments
    if (task.assigneeId && task.assigneeId !== userId) {
        const commenter = await db_1.default.user.findUnique({ where: { id: userId }, select: { name: true } });
        await db_1.default.notification.create({
            data: {
                message: `${commenter?.name || 'Someone'} commented on your assigned task '${task.title}': "${content.substring(0, 30)}..."`,
                userId: task.assigneeId,
            },
        });
    }
    return comment;
};
/**
 * Get all comments for a task
 */
const getComments = async (taskId) => {
    return db_1.default.comment.findMany({
        where: { taskId },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
        orderBy: {
            createdAt: 'asc',
        },
    });
};
/**
 * Add an attachment to a task
 */
const createAttachment = async (taskId, payload, userId) => {
    const task = await db_1.default.task.findUnique({
        where: { id: taskId },
    });
    if (!task) {
        throw new AppError_1.default(404, 'Task not found!');
    }
    const attachment = await db_1.default.attachment.create({
        data: {
            filename: payload.filename,
            fileUrl: payload.fileUrl,
            taskId,
            userId,
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });
    // Log activity
    const uploader = await db_1.default.user.findUnique({ where: { id: userId }, select: { name: true } });
    const logMessage = `${uploader?.name || 'User'} attached file '${payload.filename}' to task '${task.title}'`;
    await createActivityLog(logMessage, userId, task.projectId);
    return attachment;
};
/**
 * Get all attachments for a task
 */
const getAttachments = async (taskId) => {
    return db_1.default.attachment.findMany({
        where: { taskId },
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};
exports.TaskService = {
    createTask,
    getAllTasks,
    updateTask,
    deleteTask,
    getMyTasks,
    createComment,
    getComments,
    createAttachment,
    getAttachments,
};
