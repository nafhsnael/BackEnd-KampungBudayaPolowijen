import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { validateBody } from '../middlewares/validate.middleware';
import { LoginSchema, GoogleLoginSchema } from '../dtos/auth.dto';

const router = Router();

// Dependency Injection Setup
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

/**
 * @route   POST /api/auth/login
 * @desc    Login with Email and Password
 * @access  Public
 */
router.post('/login', validateBody(LoginSchema), authController.login);

/**
 * @route   POST /api/auth/google
 * @desc    Login with Google OAuth ID Token
 * @access  Public
 */
router.post('/google', validateBody(GoogleLoginSchema), authController.googleLogin);

export default router;
