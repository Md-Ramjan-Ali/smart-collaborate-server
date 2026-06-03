import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/db';
import config from '../../config';
import AppError from '../../errors/AppError';

// Types
import { User } from '../../../generated/prisma/client';

/**
 * Register a new user in the database
 */
const registerUser = async (payload: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(400, 'User with this email already exists!');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Save to database
  const result = await prisma.user.create({
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
const loginUser = async (payload: Pick<User, 'email' | 'password'>) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password!');
  }

  // Verify password
  const isPasswordMatched = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordMatched) {
    throw new AppError(401, 'Invalid email or password!');
  }

  // Generate JWT Token
  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_secret, {
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
  const result = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
  return result;
};

export const UserService = {
  registerUser,
  loginUser,
  getAllUsers,
};
