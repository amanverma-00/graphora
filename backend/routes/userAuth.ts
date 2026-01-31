import * as express from 'express';
import { protect, validate, authLimiter, otpLimiter, passwordResetLimiter } from '../middleware';
import {
    registerSchema,
    loginSchema,
    verifyOTPSchema,
    resendOTPSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    changePasswordSchema
} from '../validator';
import {
    register,
    verifyOTP,
    resendOTP,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
} from '../controller/authController';

const authRouter: express.Router = express.Router();

authRouter.post('/register', authLimiter, validate(registerSchema), register);
authRouter.post('/login', authLimiter, validate(loginSchema), login);

authRouter.post('/verify-otp', otpLimiter, validate(verifyOTPSchema), verifyOTP);
authRouter.post('/resend-otp', otpLimiter, validate(resendOTPSchema), resendOTP);

authRouter.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);


authRouter.post('/logout', protect, logout);
authRouter.get('/profile', protect, getProfile);
authRouter.patch('/profile', protect, validate(updateProfileSchema), updateProfile);
authRouter.patch('/change-password', protect, validate(changePasswordSchema), changePassword);

// ==================== HEALTH CHECK ====================

authRouter.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Auth service is healthy' });
});

export default authRouter;