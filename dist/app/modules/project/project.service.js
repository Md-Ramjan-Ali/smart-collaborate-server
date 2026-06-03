"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const db_1 = __importDefault(require("../../lib/db"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const client_1 = require("../../../generated/prisma/client");
/**
 * Create a new project (Only ADMIN and PROJECT_MANAGER allowed)
 */
const createProject = async (payload, ownerId) => {
    // Check if project title is unique
    const existingProject = await db_1.default.project.findUnique({
        where: { title: payload.title },
    });
    if (existingProject) {
        throw new AppError_1.default(400, 'Project title must be unique!');
    }
    // Create project with owner and optional team members connection
    const result = await db_1.default.project.create({
        data: {
            title: payload.title,
            description: payload.description,
            status: payload.status || 'NOT_STARTED',
            startDate: new Date(payload.startDate),
            endDate: new Date(payload.endDate),
            owner: { connect: { id: ownerId } },
            teamMembers: payload.teamMembers && payload.teamMembers.length > 0
                ? { connect: payload.teamMembers.map((id) => ({ id })) }
                : undefined,
        },
        include: {
            owner: {
                select: { id: true, name: true, email: true },
            },
            teamMembers: {
                select: { id: true, name: true, email: true, role: true },
            },
        },
    });
    return result;
};
/**
 * Get projects matching user permission
 * - ADMIN: See all projects
 * - PROJECT_MANAGER / TEAM_MEMBER: See projects they own OR belong to as members
 */
const getAllProjects = async (userId, role) => {
    if (role === client_1.Role.ADMIN) {
        return db_1.default.project.findMany({
            include: {
                owner: { select: { id: true, name: true, email: true } },
                teamMembers: { select: { id: true, name: true, email: true, role: true } },
            },
        });
    }
    // Find projects where user is owner OR a team member
    return db_1.default.project.findMany({
        where: {
            OR: [
                { ownerId: userId },
                { teamMembers: { some: { id: userId } } },
            ],
        },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            teamMembers: { select: { id: true, name: true, email: true, role: true } },
        },
    });
};
/**
 * Get a single project by ID (Validates member access)
 */
const getProjectById = async (projectId, userId, role) => {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            teamMembers: { select: { id: true, name: true, email: true, role: true } },
            tasks: {
                include: {
                    assignee: { select: { id: true, name: true, email: true } },
                },
            },
        },
    });
    if (!project) {
        throw new AppError_1.default(404, 'Project not found!');
    }
    // Enforce access control
    if (role !== client_1.Role.ADMIN && project.ownerId !== userId) {
        const isMember = project.teamMembers.some((member) => member.id === userId);
        if (!isMember) {
            throw new AppError_1.default(403, 'You do not have permission to view this project!');
        }
    }
    return project;
};
/**
 * Update project details (Only ADMIN or OWNER of project)
 */
const updateProject = async (projectId, payload, userId, role) => {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
    });
    if (!project) {
        throw new AppError_1.default(404, 'Project not found!');
    }
    // Check update permissions (Only ADMIN or Owner PM)
    if (role !== client_1.Role.ADMIN && project.ownerId !== userId) {
        throw new AppError_1.default(403, 'You do not have permission to update this project!');
    }
    // Handle payload and teamMembers connection
    const { teamMembers, startDate, endDate, ...otherData } = payload;
    const updateData = { ...otherData };
    if (startDate)
        updateData.startDate = new Date(startDate);
    if (endDate)
        updateData.endDate = new Date(endDate);
    if (teamMembers) {
        // Replace all current team members with the new list
        updateData.teamMembers = {
            set: teamMembers.map((id) => ({ id })),
        };
    }
    const result = await db_1.default.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
            owner: { select: { id: true, name: true, email: true } },
            teamMembers: { select: { id: true, name: true, email: true, role: true } },
        },
    });
    return result;
};
/**
 * Invite/Add a team member to a project
 */
const addTeamMember = async (projectId, memberId, userId, role) => {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: { teamMembers: true },
    });
    if (!project) {
        throw new AppError_1.default(404, 'Project not found!');
    }
    // Check if owner or Admin
    if (role !== client_1.Role.ADMIN && project.ownerId !== userId) {
        throw new AppError_1.default(403, 'You do not have permission to invite members to this project!');
    }
    // Check if user exists
    const user = await db_1.default.user.findUnique({ where: { id: memberId } });
    if (!user) {
        throw new AppError_1.default(404, 'User to add not found!');
    }
    // Connect user as a member
    const result = await db_1.default.project.update({
        where: { id: projectId },
        data: {
            teamMembers: {
                connect: { id: memberId },
            },
        },
        include: {
            teamMembers: { select: { id: true, name: true, email: true } },
        },
    });
    return result;
};
/**
 * Delete project (Only ADMIN or OWNER of project)
 */
const deleteProject = async (projectId, userId, role) => {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
    });
    if (!project) {
        throw new AppError_1.default(404, 'Project not found!');
    }
    // Check permissions
    if (role !== client_1.Role.ADMIN && project.ownerId !== userId) {
        throw new AppError_1.default(403, 'You do not have permission to delete this project!');
    }
    await db_1.default.project.delete({
        where: { id: projectId },
    });
    return { id: projectId };
};
exports.ProjectService = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    addTeamMember,
    deleteProject,
};
