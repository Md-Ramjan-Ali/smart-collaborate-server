import { Router } from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';

const router = Router();

// Auth routes
router.post('/signup', UserController.registerUser);
router.post('/login', UserController.loginUser);

// User retrieval route (requires valid token for task assignees & team builder)
router.get('/', auth(), UserController.getAllUsers);

export const UserRoutes = router;
