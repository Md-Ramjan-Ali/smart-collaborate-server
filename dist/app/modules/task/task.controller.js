"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const task_service_1 = require("./task.service");
/**
 * Handle task creation requests
 */
const createTask = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { task, warningMessage } = await task_service_1.TaskService.createTask(req.body, userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: warningMessage || 'Task created successfully!',
        data: {
            task,
            warning: warningMessage || null,
        },
    });
});
/**
 * Handle fetching all tasks list with search, filter, pagination, and sorting
 */
const getAllTasks = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await task_service_1.TaskService.getAllTasks(userId, role, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Tasks retrieved successfully!',
        data: result,
    });
});
/**
 * Handle task updates (reassignment, details, status)
 */
const updateTask = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id;
    const role = req.user?.role;
    const { task, warningMessage } = await task_service_1.TaskService.updateTask(id, req.body, userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: warningMessage || 'Task updated successfully!',
        data: {
            task,
            warning: warningMessage || null,
        },
    });
});
/**
 * Handle task deletion
 */
const deleteTask = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await task_service_1.TaskService.deleteTask(id, userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Task deleted successfully!',
        data: result,
    });
});
/**
 * Fetch personal tasks assigned to the logged-in Team Member (grouped by TO_DO & IN_PROGRESS)
 */
const getMyTasks = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const result = await task_service_1.TaskService.getMyTasks(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Personal tasks retrieved successfully!',
        data: result,
    });
});
exports.TaskController = {
    createTask,
    getAllTasks,
    updateTask,
    deleteTask,
    getMyTasks,
};
