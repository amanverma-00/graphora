// ==================== MIDDLEWARE INDEX ====================
// Export all middleware from a single entry point

// Authentication & Authorization
export { protect, restrictTo, adminOnly, optionalAuth, requireVerifiedEmail, AuthenticatedRequest } from './authMiddleware';

export { default as validate, ValidationError } from './validation';

export {
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    otpLimiter,
    submissionLimiter,
    securityHeaders,
    sanitizeData,
    preventParamPollution,
    requestLogger,
    notFound,
    errorHandler,
    corsOptions
} from './security';

import protect from './authMiddleware';
import validate from './validation';

export default { protect, validate };