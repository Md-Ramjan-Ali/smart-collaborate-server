"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const user_service_1 = require("./user.service");
/**
 * Handle user registration request
 */
const registerUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserService.registerUser(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: 'User registered successfully!',
        data: result,
    });
});
/**
 * Handle user login request
 */
const loginUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserService.loginUser(req.body);
    // Set the token inside cookie
    res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User logged in successfully!',
        data: result,
    });
});
/**
 * Handle user logout request
 */
const logoutUser = (0, catchAsync_1.default)(async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User logged out successfully!',
        data: null,
    });
});
/**
 * Fetch all registered users
 */
const getAllUsers = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserService.getAllUsers();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Users retrieved successfully!',
        data: result,
    });
});
exports.UserController = {
    registerUser,
    loginUser,
    logoutUser,
    getAllUsers,
};
