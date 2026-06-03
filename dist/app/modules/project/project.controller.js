"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const project_service_1 = require("./project.service");
/**
 * Handle request for creating a new project
 */
const createProject = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const result = await project_service_1.ProjectService.createProject(req.body, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: 'Project created successfully!',
        data: result,
    });
});
/**
 * Handle request for fetching all projects of the logged-in user
 */
const getAllProjects = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await project_service_1.ProjectService.getAllProjects(userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Projects retrieved successfully!',
        data: result,
    });
});
/**
 * Handle request for fetching a single project by ID
 */
const getProjectById = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await project_service_1.ProjectService.getProjectById(id, userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Project details retrieved successfully!',
        data: result,
    });
});
/**
 * Handle request for updating project metadata
 */
const updateProject = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await project_service_1.ProjectService.updateProject(id, req.body, userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Project updated successfully!',
        data: result,
    });
});
/**
 * Handle request for adding/inviting a team member to a project
 */
const addTeamMember = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id; // project ID
    const { memberId } = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await project_service_1.ProjectService.addTeamMember(id, memberId, userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Team member added successfully!',
        data: result,
    });
});
/**
 * Handle request for deleting a project
 */
const deleteProject = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await project_service_1.ProjectService.deleteProject(id, userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Project deleted successfully!',
        data: result,
    });
});
exports.ProjectController = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    addTeamMember,
    deleteProject,
};
