"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../../lib/db"));
const config_1 = __importDefault(require("../../config"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
/**
 * Register a new user in the database
 */
const registerUser = async (payload) => {
    // Check if email already exists
    const existingUser = await db_1.default.user.findUnique({
        where: { email: payload.email },
    });
    if (existingUser) {
        throw new AppError_1.default(400, 'User with this email already exists!');
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(payload.password, 10);
    // Save to database
    const result = await db_1.default.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            role: payload.role,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return result;
};
/**
 * Authenticate user and generate JWT token
 */
const loginUser = async (payload) => {
    // Find user by email
    const user = await db_1.default.user.findUnique({
        where: { email: payload.email },
    });
    if (!user) {
        throw new AppError_1.default(401, 'Invalid email or password!');
    }
    // Verify password
    const isPasswordMatched = await bcryptjs_1.default.compare(payload.password, user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(401, 'Invalid email or password!');
    }
    // Generate JWT Token
    const jwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };
    const accessToken = jsonwebtoken_1.default.sign(jwtPayload, config_1.default.jwt_secret, {
        expiresIn: '7d',
    });
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        accessToken,
    };
};
/**
 * Get all registered users (useful for Project Manager/Admin when adding members to project)
 */
const getAllUsers = async () => {
    const result = await db_1.default.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });
    return result;
};
exports.UserService = {
    registerUser,
    loginUser,
    getAllUsers,
};
