import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: { message: 'Too many requests, please try again later.' }
});

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

router.get('/me', authenticateJWT, authController.getMe);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticateJWT, authController.logoutAll);

export default router;
