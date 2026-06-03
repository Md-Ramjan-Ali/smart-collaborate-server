import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import { Role } from '../../generated/prisma/client';

// Extend Express Request interface to store authenticated user details
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: string; email: string; role: Role };
    }
  }
}

const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Attempt to extract token from cookies or Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token is provided
    if (!token) {
      throw new AppError(401, 'You are not authorized to access this resource!');
    }

    // Verify JWT token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;
    } catch (err) {
      throw new AppError(401, 'Invalid or expired token!');
    }

    // Check Role-Based Access Control
    const { role } = decoded;
    if (requiredRoles.length > 0 && !requiredRoles.includes(role as Role)) {
      throw new AppError(403, 'You do not have permission to perform this action!');
    }

    // Attach user info to request
    req.user = decoded as JwtPayload & { id: string; email: string; role: Role };
    next();
  });
};

export default auth;
