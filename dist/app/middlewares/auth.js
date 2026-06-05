"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const auth = (...requiredRoles) => {
    return (0, catchAsync_1.default)(async (req, res, next) => {
        // Attempt to extract token from cookies or Authorization header
        let token = req.cookies?.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check if token is provided
        if (!token) {
            throw new AppError_1.default(401, 'You are not authorized to access this resource!');
        }
        // Verify JWT token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_secret);
        }
        catch (err) {
            throw new AppError_1.default(401, 'Invalid or expired token!');
        }
        // Check Role-Based Access Control
        const { role } = decoded;
        if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
            throw new AppError_1.default(403, 'You do not have permission to perform this action!');
        }
        // Attach user info to request
        req.user = decoded;
        next();
    });
};
exports.default = auth;
