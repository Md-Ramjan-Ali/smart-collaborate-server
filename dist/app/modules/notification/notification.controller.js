"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const notification_service_1 = require("./notification.service");
const getMyNotifications = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const result = await notification_service_1.NotificationService.getMyNotifications(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Notifications retrieved successfully!',
        data: result,
    });
});
const markAsRead = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id;
    const result = await notification_service_1.NotificationService.markAsRead(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Notification marked as read!',
        data: result,
    });
});
exports.NotificationController = {
    getMyNotifications,
    markAsRead,
};
