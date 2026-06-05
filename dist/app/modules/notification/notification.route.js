"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = (0, express_1.Router)();
// Get My Notifications
router.get('/', (0, auth_1.default)(), notification_controller_1.NotificationController.getMyNotifications);
// Mark as Read
router.patch('/:id/read', (0, auth_1.default)(), notification_controller_1.NotificationController.markAsRead);
exports.NotificationRoutes = router;
