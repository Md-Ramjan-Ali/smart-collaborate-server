"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRoutes = void 0;
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
// Retrieve all dashboard stats, charts, activities, and deadlines
router.get('/meta', (0, auth_1.default)(), dashboard_controller_1.DashboardController.getDashboardMeta);
// Retrieve workload summary of members for a specific project
router.get('/workload/:projectId', (0, auth_1.default)(), dashboard_controller_1.DashboardController.getProjectWorkload);
exports.DashboardRoutes = router;
