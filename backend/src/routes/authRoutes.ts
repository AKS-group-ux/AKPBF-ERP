import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();

// Authentication endpoint
router.post('/login', AuthController.login);

// Secret rotation token endpoint
router.post('/refresh', AuthController.refresh);

// Secure revocation logger
router.post('/logout', AuthMiddleware.authenticate as any, AuthController.logout);

// Password recovery routines
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Retrieve active session profile
router.get('/me', AuthMiddleware.authenticate as any, (req: any, res) => {
  res.json({
    success: true,
    user: req.tokenUser
  });
});

export default router;
