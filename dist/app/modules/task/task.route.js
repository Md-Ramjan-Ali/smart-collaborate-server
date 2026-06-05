"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRoutes = void 0;
const express_1 = require("express");
const task_controller_1 = require("./task.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("../../../generated/prisma/client");
const router = (0, express_1.Router)();
// Create Task (Only ADMIN & Project Managers can create tasks)
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER), task_controller_1.TaskController.createTask);
// Get All Tasks (Filters by query param, accessible by any logged-in user)
router.get('/', (0, auth_1.default)(), task_controller_1.TaskController.getAllTasks);
// Get My Tasks (Personal view for Team Members to see assigned tasks)
router.get('/my-tasks', (0, auth_1.default)(), task_controller_1.TaskController.getMyTasks);
// Update Task details (Any role can hit, but Team Member role is restricted to status-only in service)
router.patch('/:id', (0, auth_1.default)(), task_controller_1.TaskController.updateTask);
// Delete Task (Only ADMIN & Project Managers)
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER), task_controller_1.TaskController.deleteTask);
// Comments endpoints (Any logged-in user can view/create comments)
router.post('/:id/comments', (0, auth_1.default)(), task_controller_1.TaskController.createComment);
router.get('/:id/comments', (0, auth_1.default)(), task_controller_1.TaskController.getComments);
// Attachments endpoints (Any logged-in user can view/create attachments)
router.post('/:id/attachments', (0, auth_1.default)(), task_controller_1.TaskController.createAttachment);
router.get('/:id/attachments', (0, auth_1.default)(), task_controller_1.TaskController.getAttachments);
exports.TaskRoutes = router;
