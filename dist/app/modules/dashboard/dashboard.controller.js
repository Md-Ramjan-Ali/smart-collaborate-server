"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const dashboard_service_1 = require("./dashboard.service");
/**
 * Handle dashboard metadata request
 */
const getDashboardMeta = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await dashboard_service_1.DashboardService.getDashboardMeta(userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Dashboard analytics retrieved successfully!',
        data: result,
    });
});
/**
 * Handle request for project workload summaries
 */
const getProjectWorkload = (0, catchAsync_1.default)(async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user?.id;
    const role = req.user?.role;
    const result = await dashboard_service_1.DashboardService.getProjectWorkload(projectId, userId, role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Project workload summary retrieved successfully!',
        data: result,
    });
});
exports.DashboardController = {
    getDashboardMeta,
    getProjectWorkload,
};
