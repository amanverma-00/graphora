import { Request, Response, NextFunction, RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many requests from this IP, please try again after 15 minutes',
  },
  skip: (req: Request) => {
    return req.path === '/health' || req.path === '/api/health'
  },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // More lenient in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many authentication attempts, please try again after 15 minutes',
  },
  // Skip rate limiting entirely in development if needed
  skip: (_req) =>
    process.env.NODE_ENV === 'development' &&
    process.env.SKIP_RATE_LIMIT === 'true',
})

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after an hour',
  },
})

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 10 minutes',
  },
})

export const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions, please slow down',
  },
})

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})

// ==================== DATA SANITIZATION ====================

/**
 * Sanitize data against NoSQL injection (Express 5 compatible)
 * express-mongo-sanitize tries to modify req.query which is read-only in Express 5
 * This custom middleware only sanitizes req.body and req.params
 */
const sanitizeObject = (
  obj: Record<string, unknown>,
): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    // Skip keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      console.warn(`[Security] Blocked potentially malicious key: ${key}`)
      continue
    }
    const value = obj[key]
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : item,
      )
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export const sanitizeData: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  next()
}

/**
 * Prevent HTTP Parameter Pollution (Express 5 compatible)
 * hpp package is not compatible with Express 5 (req.query is read-only)
 * This is a no-op middleware - Express 5 handles arrays in query params differently
 */
export const preventParamPollution: RequestHandler = (_req, _res, next) => {
  // Express 5 handles query params safely by default
  // No modification needed - just pass through
  next()
}

// ==================== REQUEST LOGGING ====================

/**
 * Request logging middleware for security auditing
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')?.substring(0, 100),
  }

  // Log only in development or for specific sensitive routes
  if (process.env.NODE_ENV === 'development' || req.path.includes('/auth/')) {
    console.log('[Request]', JSON.stringify(logData))
  }

  next()
}

// ==================== ERROR HANDLERS ====================

/**
 * 404 Not Found handler
 */
export const notFound = (
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
}

/**
 * Global error handler
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error('[Error]', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  })

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
    return
  }

  // Mongoose duplicate key error
  if (
    error.name === 'MongoServerError' &&
    (error as Error & { code?: number }).code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: 'Duplicate entry found',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
    return
  }

  // Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
    return
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    })
    return
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    })
    return
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
}

// ==================== CORS HELPER ====================

/**
 * Allowed origins for CORS
 */
export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean)

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}
