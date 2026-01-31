import { z } from 'zod';

// ==================== ENUMS (matching model) ====================

const difficultyEnum = ['easy', 'medium', 'hard'] as const;

const patternEnum = [
    'sliding window',
    'two pointers',
    'tree traversal',
    'graph traversal',
    'dynamic programming',
    'backtracking',
    'greedy',
    'heap',
    'binary search',
    'stack',
    'bit manipulation',
    'matrix',
    'prefix sum'
] as const;

const supportedLanguages = [
    'javascript',
    'python',
    'java',
    'c++',
    'c',
    'go',
    'rust',
    'typescript'
] as const;

// ==================== REUSABLE SCHEMAS ====================

const mongoIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

const sanitizedString = (maxLength: number = 500) =>
    z.string()
        .max(maxLength)
        .transform(val => val.trim())
        .refine(val => !/<script/i.test(val), 'Script tags are not allowed');

const testCaseSchema = z.object({
    input: z
        .string()
        .min(1, 'Input is required')
        .max(10000, 'Input is too long'),
    output: z
        .string()
        .min(1, 'Output is required')
        .max(10000, 'Output is too long'),
    explanation: sanitizedString(1000).optional()
});

const hiddenTestCaseSchema = z.object({
    input: z
        .string()
        .min(1, 'Input is required')
        .max(10000, 'Input is too long'),
    output: z
        .string()
        .min(1, 'Output is required')
        .max(10000, 'Output is too long')
});

const codeSchema = z.object({
    language: z
        .string()
        .min(1, 'Language is required')
        .max(50, 'Language name is too long'),
    code: z
        .string()
        .min(1, 'Code is required')
        .max(50000, 'Code is too long')
});

// ==================== CREATE PROBLEM SCHEMA ====================

export const createProblemSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(1, 'Title is required')
            .max(200, 'Title cannot exceed 200 characters')
            .transform(val => val.trim()),

        description: z
            .string()
            .min(10, 'Description must be at least 10 characters')
            .max(50000, 'Description is too long'),

        difficulty: z.enum(difficultyEnum, {
            errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' })
        }),

        companyTags: z
            .array(sanitizedString(100))
            .max(20, 'Maximum 20 company tags allowed')
            .optional()
            .default([]),

        topics: z
            .array(sanitizedString(100))
            .min(1, 'At least one topic is required')
            .max(10, 'Maximum 10 topics allowed'),

        pattern: z
            .array(z.enum(patternEnum))
            .max(5, 'Maximum 5 patterns allowed')
            .optional()
            .default([]),

        visibleTestCases: z
            .array(testCaseSchema)
            .min(1, 'At least one visible test case is required')
            .max(10, 'Maximum 10 visible test cases allowed'),

        hiddenTestCases: z
            .array(hiddenTestCaseSchema)
            .min(1, 'At least one hidden test case is required')
            .max(50, 'Maximum 50 hidden test cases allowed'),

        starterCode: z
            .array(codeSchema)
            .min(1, 'At least one starter code is required')
            .max(10, 'Maximum 10 starter codes allowed'),

        solutions: z
            .array(codeSchema)
            .max(10, 'Maximum 10 solutions allowed')
            .optional()
            .default([]),

        constraints: sanitizedString(2000).optional().default(''),

        hints: z
            .array(sanitizedString(500))
            .max(5, 'Maximum 5 hints allowed')
            .optional()
            .default([]),

        memoryLimit: z
            .number()
            .int('Memory limit must be an integer')
            .min(1, 'Memory limit must be at least 1 MB')
            .max(1024, 'Memory limit cannot exceed 1024 MB')
            .optional()
            .default(256),

        timeLimit: z
            .number()
            .int('Time limit must be an integer')
            .min(100, 'Time limit must be at least 100ms')
            .max(30000, 'Time limit cannot exceed 30 seconds')
            .optional()
            .default(2000),

        premium: z
            .boolean()
            .optional()
            .default(false),

        relatedProblems: z
            .array(mongoIdSchema)
            .max(10, 'Maximum 10 related problems allowed')
            .optional()
            .default([])
    })
});

// ==================== UPDATE PROBLEM SCHEMA ====================

export const updateProblemSchema = z.object({
    params: z.object({
        id: mongoIdSchema
    }),
    body: z.object({
        title: z
            .string()
            .min(1, 'Title cannot be empty')
            .max(200, 'Title cannot exceed 200 characters')
            .transform(val => val.trim())
            .optional(),

        description: z
            .string()
            .min(10, 'Description must be at least 10 characters')
            .max(50000, 'Description is too long')
            .optional(),

        difficulty: z.enum(difficultyEnum, {
            errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' })
        }).optional(),

        companyTags: z
            .array(sanitizedString(100))
            .max(20, 'Maximum 20 company tags allowed')
            .optional(),

        topics: z
            .array(sanitizedString(100))
            .min(1, 'At least one topic is required')
            .max(10, 'Maximum 10 topics allowed')
            .optional(),

        pattern: z
            .array(z.enum(patternEnum))
            .max(5, 'Maximum 5 patterns allowed')
            .optional(),

        visibleTestCases: z
            .array(testCaseSchema)
            .min(1, 'At least one visible test case is required')
            .max(10, 'Maximum 10 visible test cases allowed')
            .optional(),

        hiddenTestCases: z
            .array(hiddenTestCaseSchema)
            .min(1, 'At least one hidden test case is required')
            .max(50, 'Maximum 50 hidden test cases allowed')
            .optional(),

        starterCode: z
            .array(codeSchema)
            .min(1, 'At least one starter code is required')
            .max(10, 'Maximum 10 starter codes allowed')
            .optional(),

        solutions: z
            .array(codeSchema)
            .max(10, 'Maximum 10 solutions allowed')
            .optional(),

        constraints: sanitizedString(2000).optional(),

        hints: z
            .array(sanitizedString(500))
            .max(5, 'Maximum 5 hints allowed')
            .optional(),

        memoryLimit: z
            .number()
            .int('Memory limit must be an integer')
            .min(1, 'Memory limit must be at least 1 MB')
            .max(1024, 'Memory limit cannot exceed 1024 MB')
            .optional(),

        timeLimit: z
            .number()
            .int('Time limit must be an integer')
            .min(100, 'Time limit must be at least 100ms')
            .max(30000, 'Time limit cannot exceed 30 seconds')
            .optional(),

        premium: z.boolean().optional(),

        relatedProblems: z
            .array(mongoIdSchema)
            .max(10, 'Maximum 10 related problems allowed')
            .optional()
    }).refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update'
    })
});

// ==================== GET PROBLEM SCHEMA ====================

export const getProblemSchema = z.object({
    params: z.object({
        id: z.string().refine(
            (val) => /^[0-9a-fA-F]{24}$/.test(val) || /^[a-z0-9-]+$/.test(val),
            'Must be a valid MongoDB ObjectId or slug'
        )
    })
});

// ==================== LIST PROBLEMS SCHEMA ====================

export const listProblemsSchema = z.object({
    query: z.object({
        page: z
            .string()
            .optional()
            .transform(val => val ? parseInt(val, 10) : 1)
            .pipe(z.number().min(1).max(1000)),

        limit: z
            .string()
            .optional()
            .transform(val => val ? parseInt(val, 10) : 20)
            .pipe(z.number().min(1).max(100)),

        difficulty: z.enum(difficultyEnum).optional(),

        topic: sanitizedString(100).optional(),

        company: sanitizedString(100).optional(),

        pattern: z.enum(patternEnum).optional(),

        search: z
            .string()
            .max(100, 'Search query is too long')
            .transform(val => val.trim())
            .optional(),

        premium: z
            .string()
            .optional()
            .transform(val => val === 'true'),

        sortBy: z
            .enum(['title', 'difficulty', 'createdAt', 'acceptanceRate', 'likes'])
            .optional()
            .default('createdAt'),

        sortOrder: z
            .enum(['asc', 'desc'])
            .optional()
            .default('desc')
    }).optional().default({})
});

// ==================== DELETE PROBLEM SCHEMA ====================

export const deleteProblemSchema = z.object({
    params: z.object({
        id: mongoIdSchema
    })
});

// ==================== BULK OPERATIONS SCHEMA ====================

export const bulkDeleteProblemsSchema = z.object({
    body: z.object({
        ids: z
            .array(mongoIdSchema)
            .min(1, 'At least one problem ID is required')
            .max(50, 'Maximum 50 problems can be deleted at once')
    })
});

// ==================== TYPE EXPORTS ====================

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
export type GetProblemInput = z.infer<typeof getProblemSchema>;
export type ListProblemsInput = z.infer<typeof listProblemsSchema>;
export type DeleteProblemInput = z.infer<typeof deleteProblemSchema>;
export type BulkDeleteProblemsInput = z.infer<typeof bulkDeleteProblemsSchema>;

// ==================== VALIDATOR OBJECT EXPORT ====================

const problemValidators = {
    createProblem: createProblemSchema,
    updateProblem: updateProblemSchema,
    getProblem: getProblemSchema,
    listProblems: listProblemsSchema,
    deleteProblem: deleteProblemSchema,
    bulkDeleteProblems: bulkDeleteProblemsSchema
};

export default problemValidators;