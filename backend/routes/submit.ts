import * as express from 'express';
import { protect, validate, submissionLimiter } from '../middleware';
import { z } from 'zod';
import {
    submitCode,
    runCode,
    getSubmissionHistory,
    getSubmissionById,
    getRecentSubmissions,
} from '../controller/submitController';

const submitRouter: express.Router = express.Router();

// ==================== VALIDATION SCHEMAS ====================

const problemIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid problem ID'),
    }),
});

const submissionIdParamSchema = z.object({
    params: z.object({
        submissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid submission ID'),
    }),
});

const submitCodeSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid problem ID'),
    }),
    body: z.object({
        code: z.string()
            .min(1, 'Code is required')
            .max(65536, 'Code exceeds maximum length'),
        language: z.enum(['JavaScript', 'javascript', 'Python', 'python', 'Java', 'java', 'C++', 'c++', 'cpp'], {
            errorMap: () => ({ message: 'Invalid programming language' }),
        }),
        mockSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid mock session ID').optional(),
    }),
});

const runCodeSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid problem ID'),
    }),
    body: z.object({
        code: z.string()
            .min(1, 'Code is required')
            .max(65536, 'Code exceeds maximum length'),
        language: z.enum(['JavaScript', 'javascript', 'Python', 'python', 'Java', 'java', 'C++', 'c++', 'cpp'], {
            errorMap: () => ({ message: 'Invalid programming language' }),
        }),
        customInput: z.string().max(65536, 'Input exceeds maximum length').optional(),
    }),
});

const recentSubmissionsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        status: z.enum(['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error']).optional(),
    }).optional(),
});

// ==================== HEALTH CHECK ====================

submitRouter.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Submit service is healthy' });
});

// ==================== SUBMISSION ROUTES ====================

// Submit code for full evaluation (rate limited)
submitRouter.post(
    '/submit/:id',
    protect,
    submissionLimiter,
    validate(submitCodeSchema),
    submitCode
);

// Run code with custom input (rate limited, no saving)
submitRouter.post(
    '/run/:id',
    protect,
    submissionLimiter,
    validate(runCodeSchema),
    runCode
);

// Get user's recent submissions across all problems
submitRouter.get(
    '/recent',
    protect,
    validate(recentSubmissionsSchema),
    getRecentSubmissions
);

// Get submission history for a specific problem
submitRouter.get(
    '/history/:id',
    protect,
    validate(problemIdParamSchema),
    getSubmissionHistory
);

// Get a single submission by ID
submitRouter.get(
    '/submission/:submissionId',
    protect,
    validate(submissionIdParamSchema),
    getSubmissionById
);

export default submitRouter;