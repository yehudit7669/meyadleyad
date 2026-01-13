import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { registerSchema, loginSchema, googleAuthSchema, refreshTokenSchema } from './auth.validation';
import { authenticate } from '../../middlewares/auth';
import { UsersController } from '../users/users.controller';

const router = Router();
const authController = new AuthController();
const usersController = new UsersController();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleAuthSchema), authController.googleAuth);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/request-reset', authController.requestPasswordReset);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authenticate, authController.changePassword);

// Alias for /users/profile
router.get('/me', authenticate, usersController.getProfile);

export default router;
