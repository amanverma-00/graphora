import * as express from 'express';
import { protect, validate, submissionLimiter } from '../middleware';
import { z } from 'zod';
import {
    generateMock,
    startMock,
    getMockSession,
    switchProblem,
    completeMock,
    abandonMock,
    getMockHistory,
    getActiveMock,
    getMockStats,
    getMockLeaderboard,
} from '../controller/mockController';

const mockRouter: express.Router = express.Router();

// ==================== VALIDATION SCHEMAS ====================

const generateMockSchema = z.object({
    body: z.object({
        type: z.enum(['company', 'difficulty', 'pattern', 'custom'], {
            errorMap: () => ({ message: 'Type must be: company, difficulty, pattern, or custom' }),
        }),
        company: z.string().min(1).max(100).optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
        pattern: z.string().min(1).max(100).optional(),
        problemCount: z.number().int().min(1).max(5).optional(),
        timeLimit: z.number().int().min(15).max(180).optional(), // 15 mins to 3 hours
    }).refine(
        (data) => {
            if (data.type === 'company') return !!data.company;
            if (data.type === 'difficulty') return !!data.difficulty;
            if (data.type === 'pattern') return !!data.pattern;
            return true;
        },
        { message: 'Missing required field for the selected mock type' }
    ),
});

const sessionIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'),
    }),
});

const switchProblemSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'),
    }),
    body: z.object({
        fromOrder: z.number().int().min(1).max(5),
        toOrder: z.number().int().min(1).max(5),
    }),
});

const historyQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        type: z.enum(['company', 'difficulty', 'pattern', 'custom']).optional(),
        status: z.enum(['completed', 'abandoned', 'expired']).optional(),
    }).optional(),
});

const leaderboardQuerySchema = z.object({
    query: z.object({
        type: z.enum(['company', 'difficulty', 'pattern', 'custom']).optional(),
        company: z.string().optional(),
        timeframe: z.enum(['all', 'week', 'month']).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }).optional(),
});

// ==================== HEALTH CHECK ====================

mockRouter.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Mock service is healthy' });
});

// ==================== MOCK SESSION ROUTES ====================

// Get user's mock statistics
mockRouter.get('/stats', protect, getMockStats);

// Get current active mock session (if any)
mockRouter.get('/active', protect, getActiveMock);

// Get mock history
mockRouter.get('/history', protect, validate(historyQuerySchema), getMockHistory);

// Get leaderboard
mockRouter.get('/leaderboard', protect, validate(leaderboardQuerySchema), getMockLeaderboard);

// Generate new mock session (rate limited to prevent abuse)
mockRouter.post(
    '/generate',
    protect,
    submissionLimiter,
    validate(generateMockSchema),
    generateMock
);

// Start a pending mock session
mockRouter.post(
    '/:id/start',
    protect,
    validate(sessionIdParamSchema),
    startMock
);

// Switch problem within a mock
mockRouter.post(
    '/:id/switch-problem',
    protect,
    validate(switchProblemSchema),
    switchProblem
);

// Complete a mock session
mockRouter.post(
    '/:id/complete',
    protect,
    validate(sessionIdParamSchema),
    completeMock
);

// Abandon a mock session
mockRouter.post(
    '/:id/abandon',
    protect,
    validate(sessionIdParamSchema),
    abandonMock
);

// Get mock session details (LAST - catches /:id)
mockRouter.get(
    '/:id',
    protect,
    validate(sessionIdParamSchema),
    getMockSession
);

export default mockRouter;
