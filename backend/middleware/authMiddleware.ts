import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import User from '../models/user';
import { IUser, UserRole } from '../types/type';

interface JwtPayload {
    id: string;
    iat: number;
    exp: number;
}

export interface AuthenticatedRequest extends Request {
    user?: IUser;
}

const config = {
    jwt: {
        secret: process.env.JWT_KEY || 'your-super-secret-jwt-key-change-in-production',
    },
    env: process.env.NODE_ENV || 'development'
};

/**
 * Protect routes - requires valid JWT token
 * Checks: token exists, token is valid, user exists, user is active, password not changed after token issued
 */
export const protect = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        // Check for token in cookies first (more secure), then Authorization header
        if (req.cookies?.token && req.cookies.token !== 'loggedout') {
            token = req.cookies.token;
        } else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.'
            });
            return;
        }

        // Verify token
        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        } catch (jwtError) {
            const errorName = (jwtError as Error).name;

            if (errorName === 'JsonWebTokenError') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please log in again.'
                });
                return;
            }

            if (errorName === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Session expired. Please log in again.'
                });
                return;
            }

            throw jwtError;
        }

        // Check if user still exists
        const user = await User.findById(decoded.id).select('+passwordChangedAt');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User no longer exists.'
            });
            return;
        }

        // Check if user is active
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Account has been deactivated.'
            });
            return;
        }

        // Check if password was changed after token was issued
        if (user.passwordChangedAt) {
            const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
            if (decoded.iat < changedTimestamp) {
                res.status(401).json({
                    success: false,
                    message: 'Password changed recently. Please log in again.'
                });
                return;
            }
        }

        // Grant access - attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('[protect] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: config.env === 'development' && error instanceof Error
                ? error.message
                : undefined
        });
    }
};

// ==================== ROLE-BASED AUTHORIZATION ====================

/**
 * Restrict access to specific roles
 * Must be used AFTER protect middleware
 */
export const restrictTo = (...roles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
            return;
        }

        next();
    };
};

/**
 * Admin only middleware - shorthand for restrictTo('admin')
 * Must be used AFTER protect middleware
 */
export const adminOnly = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
        return;
    }

    next();
};

// ==================== OPTIONAL AUTH ====================

/**
 * Optional authentication - attaches user if token exists, but doesn't require it
 * Useful for routes that behave differently for authenticated users
 */
export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        if (req.cookies?.token && req.cookies.token !== 'loggedout') {
            token = req.cookies.token;
        } else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
                const user = await User.findById(decoded.id);
                if (user && user.isActive) {
                    req.user = user;
                }
            } catch {
                // Token invalid - continue without user
            }
        }

        next();
    } catch (error) {
        // Silently fail - this is optional auth
        next();
    }
};

// ==================== VERIFIED EMAIL MIDDLEWARE ====================

/**
 * Requires email to be verified
 * Must be used AFTER protect middleware
 */
export const requireVerifiedEmail = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
        return;
    }

    if (!req.user.isEmailVerified) {
        res.status(403).json({
            success: false,
            message: 'Please verify your email to access this resource'
        });
        return;
    }

    next();
};

export default protect;
