"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const db_1 = __importDefault(require("../../lib/db"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
/**
 * Fetch all notifications for the logged-in user
 */
const getMyNotifications = async (userId) => {
    return db_1.default.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};
/**
 * Mark a notification as read
 */
const markAsRead = async (notificationId, userId) => {
    const notification = await db_1.default.notification.findUnique({
        where: { id: notificationId },
    });
    if (!notification) {
        throw new AppError_1.default(404, 'Notification not found!');
    }
    if (notification.userId !== userId) {
        throw new AppError_1.default(403, 'You do not have permission to modify this notification!');
    }
    return db_1.default.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
    });
};
exports.NotificationService = {
    getMyNotifications,
    markAsRead,
};
