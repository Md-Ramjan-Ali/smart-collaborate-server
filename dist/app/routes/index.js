"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_route_1 = require("../modules/user/user.route");
const project_route_1 = require("../modules/project/project.route");
const task_route_1 = require("../modules/task/task.route");
const dashboard_route_1 = require("../modules/dashboard/dashboard.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: '/auth',
        route: user_route_1.UserRoutes,
    },
    {
        path: '/projects',
        route: project_route_1.ProjectRoutes,
    },
    {
        path: '/tasks',
        route: task_route_1.TaskRoutes,
    },
    {
        path: '/dashboard',
        route: dashboard_route_1.DashboardRoutes,
    },
];
// Register all modular routes under base path
moduleRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
