"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRoutes = void 0;
const express_1 = require("express");
const project_controller_1 = require("./project.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("../../../generated/prisma/client");
const router = (0, express_1.Router)();
// Create Project (Only ADMIN & Project Managers can create projects)
router.post('/', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER), project_controller_1.ProjectController.createProject);
// Get All Projects (Any authenticated user can fetch their projects list)
router.get('/', (0, auth_1.default)(), project_controller_1.ProjectController.getAllProjects);
// Get Single Project Details (Any authenticated member of the project)
router.get('/:id', (0, auth_1.default)(), project_controller_1.ProjectController.getProjectById);
// Update Project Details
router.patch('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER), project_controller_1.ProjectController.updateProject);
// Add Team Member to Project
router.post('/:id/invite', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER), project_controller_1.ProjectController.addTeamMember);
// Delete Project
router.delete('/:id', (0, auth_1.default)(client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER), project_controller_1.ProjectController.deleteProject);
exports.ProjectRoutes = router;
