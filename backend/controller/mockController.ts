import { Response } from 'express';
import mongoose from 'mongoose';
import Problem from '../models/problem';
import MockSession from '../models/mockSession';
import Submission from '../models/submission';
import User from '../models/user';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Difficulty } from '../types/type';

// ==================== TYPES ====================

interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

interface MockConfig {
    type: 'company' | 'difficulty' | 'pattern' | 'custom';
    company?: string;
    difficulty?: Difficulty;
    pattern?: string;
    problemCount?: number;
    timeLimit?: number; // in minutes
}

interface ProblemSelection {
    problemId: mongoose.Types.ObjectId;
    difficulty: Difficulty;
}

interface MockSessionResponse {
    sessionId: string;
    type: string;
    config: object;
    problems: Array<{
        problemId: string;
        title: string;
        difficulty: string;
        order: number;
    }>;
    timeLimit: number;
    status: string;
    expiresAt: Date;
}

// ==================== CONFIGURATION ====================

const config = {
    env: process.env.NODE_ENV || 'development',
    defaultTimeLimit: 90, // 90 minutes default
    sessionExpiryMinutes: 10, // Time to start after creation
    maxProblemsPerMock: 5,
    defaultProblemCount: 3,
    difficultyDistribution: {
        balanced: { easy: 1, medium: 1, hard: 1 },
        easy: { easy: 3, medium: 0, hard: 0 },
        medium: { easy: 0, medium: 3, hard: 0 },
        hard: { easy: 0, medium: 0, hard: 3 },
    } as Record<string, { easy: number; medium: number; hard: number }>,
};

// ==================== HELPER FUNCTIONS ====================

const sendResponse = <T>(res: Response, statusCode: number, data: ApiResponse<T>): void => {
    res.status(statusCode).json(data);
};

const sendError = (res: Response, statusCode: number, message: string): void => {
    sendResponse(res, statusCode, { success: false, message });
};

const handleError = (error: unknown, res: Response, context: string): void => {
    console.error(`[${context}] Error:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    sendResponse(res, 500, {
        success: false,
        message: `Error in ${context}`,
        error: config.env === 'development' ? errorMessage : undefined,
    });
};

/**
 * Get string value from param (handles string | string[] | undefined)
 */
const getStringParam = (param: unknown): string => {
    if (typeof param === 'string') return param;
    if (Array.isArray(param)) return param[0] || '';
    return '';
};

const isValidObjectId = (id: string): boolean => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Get string value from query param (handles string | string[] | undefined)
 */
const getQueryString = (param: unknown): string => {
    if (typeof param === 'string') return param;
    if (Array.isArray(param)) return param[0] || '';
    return '';
};

/**
 * Get number value from query param
 */
const getQueryNumber = (param: unknown, defaultValue: number): number => {
    const str = getQueryString(param);
    const num = parseInt(str, 10);
    return isNaN(num) ? defaultValue : num;
};

/**
 * Select problems based on mock configuration
 * Excludes problems the user has already solved
 */
const selectProblems = async (
    userId: mongoose.Types.ObjectId,
    mockConfig: MockConfig
): Promise<ProblemSelection[]> => {
    const { type, company, difficulty, pattern, problemCount = config.defaultProblemCount } = mockConfig;

    // Get user's solved problems to exclude
    const user = await User.findById(userId).select('solvedProblems').lean();
    const solvedProblemIds = user?.solvedProblems || [];

    // Build base query
    const baseQuery: Record<string, unknown> = {
        _id: { $nin: solvedProblemIds },
    };

    // Add type-specific filters
    switch (type) {
        case 'company':
            if (company) {
                baseQuery.companyTags = { $regex: new RegExp(company, 'i') };
            }
            break;
        case 'difficulty':
            if (difficulty) {
                baseQuery.difficulty = difficulty;
            }
            break;
        case 'pattern':
            if (pattern) {
                baseQuery.pattern = { $regex: new RegExp(pattern, 'i') };
            }
            break;
    }

    // Determine difficulty distribution
    let distribution = config.difficultyDistribution.balanced;

    if (type === 'difficulty' && difficulty) {
        distribution = config.difficultyDistribution[difficulty] || config.difficultyDistribution.balanced;
    }

    const selectedProblems: ProblemSelection[] = [];

    // Select problems by difficulty
    for (const [diff, count] of Object.entries(distribution)) {
        if (count === 0) continue;

        const diffQuery = { ...baseQuery, difficulty: diff };
        
        // Use aggregation to randomly select problems
        const problems = await Problem.aggregate([
            { $match: diffQuery },
            { $sample: { size: count } },
            { $project: { _id: 1, difficulty: 1 } },
        ]);

        for (const problem of problems) {
            selectedProblems.push({
                problemId: problem._id,
                difficulty: problem.difficulty,
            });
        }
    }

    // If we don't have enough problems with distribution, fill with any matching problems
    if (selectedProblems.length < problemCount) {
        const existingIds = selectedProblems.map(p => p.problemId);
        const fillQuery = {
            ...baseQuery,
            _id: { $nin: [...solvedProblemIds, ...existingIds] },
        };

        const remainingCount = problemCount - selectedProblems.length;
        const additionalProblems = await Problem.aggregate([
            { $match: fillQuery },
            { $sample: { size: remainingCount } },
            { $project: { _id: 1, difficulty: 1 } },
        ]);

        for (const problem of additionalProblems) {
            selectedProblems.push({
                problemId: problem._id,
                difficulty: problem.difficulty,
            });
        }
    }

    // Shuffle and return
    return selectedProblems.sort(() => Math.random() - 0.5).slice(0, problemCount);
};

// ==================== CONTROLLERS ====================

/**
 * @route   POST /api/mocks/generate
 * @desc    Generate a new mock session with problems
 * @access  Protected
 */
export const generateMock = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const { type, company, difficulty, pattern, problemCount, timeLimit } = req.body as MockConfig;

        // Validate type
        if (!type || !['company', 'difficulty', 'pattern', 'custom'].includes(type)) {
            sendError(res, 400, 'Invalid mock type. Must be: company, difficulty, pattern, or custom');
            return;
        }

        // Validate based on type
        if (type === 'company' && !company) {
            sendError(res, 400, 'Company name is required for company-based mocks');
            return;
        }

        if (type === 'difficulty' && !difficulty) {
            sendError(res, 400, 'Difficulty level is required for difficulty-based mocks');
            return;
        }

        if (type === 'pattern' && !pattern) {
            sendError(res, 400, 'Pattern is required for pattern-based mocks');
            return;
        }

        // Check for existing pending/in-progress sessions
        const existingSession = await MockSession.findOne({
            user: req.user._id,
            status: { $in: ['pending', 'in_progress'] },
        });

        if (existingSession) {
            sendError(res, 400, 'You already have an active mock session. Complete or abandon it first.');
            return;
        }

        // Select problems
        const mockConfig: MockConfig = {
            type,
            company,
            difficulty,
            pattern,
            problemCount: Math.min(problemCount || config.defaultProblemCount, config.maxProblemsPerMock),
        };

        const selectedProblems = await selectProblems(req.user._id, mockConfig);

        if (selectedProblems.length === 0) {
            sendError(res, 404, 'No problems found matching your criteria. Try different filters.');
            return;
        }

        if (selectedProblems.length < (problemCount || config.defaultProblemCount)) {
            console.warn(`[generateMock] Only found ${selectedProblems.length} problems for user ${req.user._id}`);
        }

        // Create mock session
        const sessionTimeLimit = timeLimit || config.defaultTimeLimit;
        const expiresAt = new Date(Date.now() + config.sessionExpiryMinutes * 60 * 1000);

        const mockSession = await MockSession.create({
            user: req.user._id,
            type,
            config: {
                company,
                difficulty,
                pattern,
                problemCount: selectedProblems.length,
            },
            problems: selectedProblems.map((p, index) => ({
                problem: p.problemId,
                order: index + 1,
                timeSpent: 0,
                solved: false,
            })),
            timeLimit: sessionTimeLimit,
            expiresAt,
            status: 'pending',
            score: {
                solved: 0,
                total: selectedProblems.length,
            },
        });

        // Populate problem details for response
        const populatedSession = await MockSession.findById(mockSession._id)
            .populate('problems.problem', 'title difficulty slug')
            .lean();

        const responseData: MockSessionResponse = {
            sessionId: mockSession._id.toString(),
            type: mockSession.type,
            config: mockSession.config,
            problems: populatedSession?.problems.map(p => ({
                problemId: (p.problem as any)._id.toString(),
                title: (p.problem as any).title,
                difficulty: (p.problem as any).difficulty,
                order: p.order,
            })) || [],
            timeLimit: sessionTimeLimit,
            status: 'pending',
            expiresAt,
        };

        sendResponse(res, 201, {
            success: true,
            message: `Mock session created with ${selectedProblems.length} problems. Start within ${config.sessionExpiryMinutes} minutes.`,
            data: responseData,
        });
    } catch (error) {
        handleError(error, res, 'generateMock');
    }
};

/**
 * @route   POST /api/mocks/:id/start
 * @desc    Start a pending mock session
 * @access  Protected
 */
export const startMock = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const id = getStringParam(req.params.id);

        if (!isValidObjectId(id)) {
            sendError(res, 400, 'Invalid session ID');
            return;
        }

        const session = await MockSession.findOne({
            _id: id,
            user: req.user._id,
        }).populate('problems.problem', 'title difficulty slug description constraints starterCode');

        if (!session) {
            sendError(res, 404, 'Mock session not found');
            return;
        }

        if (session.status !== 'pending') {
            sendError(res, 400, `Cannot start session with status: ${session.status}`);
            return;
        }

        // Check if session expired
        if (session.expiresAt && new Date() > session.expiresAt) {
            await MockSession.findByIdAndUpdate(id, { status: 'expired' });
            sendError(res, 400, 'Session has expired. Please generate a new mock.');
            return;
        }

        // Start the session
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + session.timeLimit * 60 * 1000);

        session.status = 'in_progress';
        session.startedAt = startTime;
        session.expiresAt = endTime;

        // Mark first problem as started
        if (session.problems.length > 0) {
            session.problems[0].startedAt = startTime;
        }

        await session.save();

        sendResponse(res, 200, {
            success: true,
            message: 'Mock session started',
            data: {
                sessionId: session._id,
                status: 'in_progress',
                startedAt: startTime,
                endsAt: endTime,
                timeLimit: session.timeLimit,
                problems: session.problems.map(p => ({
                    problemId: (p.problem as any)._id,
                    title: (p.problem as any).title,
                    difficulty: (p.problem as any).difficulty,
                    slug: (p.problem as any).slug,
                    order: p.order,
                    solved: p.solved,
                    description: (p.problem as any).description,
                    constraints: (p.problem as any).constraints,
                    starterCode: (p.problem as any).starterCode,
                })),
                currentProblem: 1,
            },
        });
    } catch (error) {
        handleError(error, res, 'startMock');
    }
};

/**
 * @route   GET /api/mocks/:id
 * @desc    Get mock session details
 * @access  Protected
 */
export const getMockSession = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const id = getStringParam(req.params.id);

        if (!isValidObjectId(id)) {
            sendError(res, 400, 'Invalid session ID');
            return;
        }

        const session = await MockSession.findOne({
            _id: id,
            user: req.user._id,
        })
            .populate('problems.problem', 'title difficulty slug description constraints starterCode visibleTestCases')
            .populate('problems.submission', 'status runtime memory testCasesPassed testCasesTotal')
            .lean();

        if (!session) {
            sendError(res, 404, 'Mock session not found');
            return;
        }

        // Calculate remaining time if in progress
        let remainingTime: number | undefined;
        if (session.status === 'in_progress' && session.expiresAt) {
            remainingTime = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
        }

        sendResponse(res, 200, {
            success: true,
            data: {
                ...session,
                remainingTime,
            },
        });
    } catch (error) {
        handleError(error, res, 'getMockSession');
    }
};

/**
 * @route   POST /api/mocks/:id/switch-problem
 * @desc    Switch to a different problem in the mock
 * @access  Protected
 */
export const switchProblem = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const id = getStringParam(req.params.id);
        const { fromOrder, toOrder } = req.body;

        if (!isValidObjectId(id)) {
            sendError(res, 400, 'Invalid session ID');
            return;
        }

        const session = await MockSession.findOne({
            _id: id,
            user: req.user._id,
            status: 'in_progress',
        });

        if (!session) {
            sendError(res, 404, 'Active mock session not found');
            return;
        }

        // Check if session has expired
        if (session.expiresAt && new Date() > session.expiresAt) {
            session.status = 'expired';
            await session.save();
            sendError(res, 400, 'Session has expired');
            return;
        }

        // Find problems by order
        const fromProblem = session.problems.find(p => p.order === fromOrder);
        const toProblem = session.problems.find(p => p.order === toOrder);

        if (!fromProblem || !toProblem) {
            sendError(res, 400, 'Invalid problem order');
            return;
        }

        // Update time spent on current problem
        if (fromProblem.startedAt) {
            const timeSpentNow = Math.floor((Date.now() - fromProblem.startedAt.getTime()) / 1000);
            fromProblem.timeSpent += timeSpentNow;
        }

        // Mark new problem as started
        toProblem.startedAt = new Date();

        await session.save();

        sendResponse(res, 200, {
            success: true,
            message: `Switched to problem ${toOrder}`,
            data: {
                currentProblem: toOrder,
                timeSpentOnPrevious: fromProblem.timeSpent,
            },
        });
    } catch (error) {
        handleError(error, res, 'switchProblem');
    }
};

/**
 * @route   POST /api/mocks/:id/complete
 * @desc    Complete/finish a mock session
 * @access  Protected
 */
export const completeMock = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const id = getStringParam(req.params.id);

        if (!isValidObjectId(id)) {
            sendError(res, 400, 'Invalid session ID');
            return;
        }

        const session = await MockSession.findOne({
            _id: id,
            user: req.user._id,
            status: 'in_progress',
        }).populate('problems.problem', 'title difficulty');

        if (!session) {
            sendError(res, 404, 'Active mock session not found');
            return;
        }

        // Calculate final scores
        const completedAt = new Date();
        const totalTime = session.startedAt
            ? Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000)
            : 0;

        const solvedCount = session.problems.filter(p => p.solved).length;
        const totalProblems = session.problems.length;

        // Calculate total time spent on all problems
        let totalTimeSpent = 0;
        for (const problem of session.problems) {
            if (problem.startedAt && !problem.completedAt) {
                problem.timeSpent += Math.floor((Date.now() - problem.startedAt.getTime()) / 1000);
            }
            totalTimeSpent += problem.timeSpent;
        }

        // Update session
        session.status = 'completed';
        session.completedAt = completedAt;
        session.score = {
            solved: solvedCount,
            total: totalProblems,
            totalTime,
            averageTime: solvedCount > 0 ? Math.floor(totalTimeSpent / solvedCount) : 0,
        };

        await session.save();

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: {
                totalMocksAttempted: 1,
                completedMocks: 1,
            },
        });

        // Calculate percentile (simplified - compare with other completed sessions)
        const betterSessions = await MockSession.countDocuments({
            type: session.type,
            'config.company': session.config.company,
            'config.difficulty': session.config.difficulty,
            status: 'completed',
            'score.solved': { $gt: solvedCount },
        });

        const totalSessions = await MockSession.countDocuments({
            type: session.type,
            'config.company': session.config.company,
            'config.difficulty': session.config.difficulty,
            status: 'completed',
        });

        const percentile = totalSessions > 1
            ? Math.round(((totalSessions - betterSessions) / totalSessions) * 100)
            : 100;

        // Update percentile
        session.score.percentile = percentile;
        await session.save();

        sendResponse(res, 200, {
            success: true,
            message: 'Mock session completed!',
            data: {
                sessionId: session._id,
                status: 'completed',
                score: {
                    solved: solvedCount,
                    total: totalProblems,
                    percentage: Math.round((solvedCount / totalProblems) * 100),
                    totalTime,
                    averageTimePerProblem: session.score.averageTime,
                    percentile,
                },
                problems: session.problems.map(p => ({
                    title: (p.problem as any).title,
                    difficulty: (p.problem as any).difficulty,
                    solved: p.solved,
                    timeSpent: p.timeSpent,
                })),
            },
        });
    } catch (error) {
        handleError(error, res, 'completeMock');
    }
};

/**
 * @route   POST /api/mocks/:id/abandon
 * @desc    Abandon a mock session
 * @access  Protected
 */
export const abandonMock = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const id = getStringParam(req.params.id);

        if (!isValidObjectId(id)) {
            sendError(res, 400, 'Invalid session ID');
            return;
        }

        const session = await MockSession.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id,
                status: { $in: ['pending', 'in_progress'] },
            },
            {
                status: 'abandoned',
                completedAt: new Date(),
            },
            { new: true }
        );

        if (!session) {
            sendError(res, 404, 'Active mock session not found');
            return;
        }

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { totalMocksAttempted: 1 },
        });

        sendResponse(res, 200, {
            success: true,
            message: 'Mock session abandoned',
            data: { sessionId: session._id, status: 'abandoned' },
        });
    } catch (error) {
        handleError(error, res, 'abandonMock');
    }
};

/**
 * @route   GET /api/mocks/history
 * @desc    Get user's mock session history
 * @access  Protected
 */
export const getMockHistory = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const page = Math.max(1, getQueryNumber(req.query.page, 1));
        const limit = Math.min(50, Math.max(1, getQueryNumber(req.query.limit, 10)));
        const skip = (page - 1) * limit;

        const type = getQueryString(req.query.type);
        const status = getQueryString(req.query.status);

        // Build filter
        const filter: Record<string, unknown> = { user: req.user._id };

        if (type && ['company', 'difficulty', 'pattern', 'custom'].includes(type)) {
            filter.type = type;
        }

        if (status && ['completed', 'abandoned', 'expired'].includes(status)) {
            filter.status = status;
        } else {
            // Default: show only finished sessions
            filter.status = { $in: ['completed', 'abandoned', 'expired'] };
        }

        const [sessions, total] = await Promise.all([
            MockSession.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('problems.problem', 'title difficulty')
                .lean(),
            MockSession.countDocuments(filter),
        ]);

        sendResponse(res, 200, {
            success: true,
            data: {
                sessions: sessions.map(s => ({
                    sessionId: s._id,
                    type: s.type,
                    config: s.config,
                    status: s.status,
                    score: s.score,
                    problemCount: s.problems.length,
                    problems: s.problems.map(p => ({
                        title: (p.problem as any)?.title,
                        difficulty: (p.problem as any)?.difficulty,
                        solved: p.solved,
                        timeSpent: p.timeSpent,
                    })),
                    startedAt: s.startedAt,
                    completedAt: s.completedAt,
                    createdAt: s.createdAt,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        handleError(error, res, 'getMockHistory');
    }
};

/**
 * @route   GET /api/mocks/active
 * @desc    Get user's current active mock session (if any)
 * @access  Protected
 */
export const getActiveMock = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const session = await MockSession.findOne({
            user: req.user._id,
            status: { $in: ['pending', 'in_progress'] },
        })
            .populate('problems.problem', 'title difficulty slug')
            .lean();

        if (!session) {
            sendResponse(res, 200, {
                success: true,
                message: 'No active mock session',
                data: null,
            });
            return;
        }

        // Check if session should be expired
        if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
            await MockSession.findByIdAndUpdate(session._id, { status: 'expired' });
            sendResponse(res, 200, {
                success: true,
                message: 'Previous session expired',
                data: null,
            });
            return;
        }

        // Calculate remaining time
        let remainingTime: number | undefined;
        if (session.status === 'in_progress' && session.expiresAt) {
            remainingTime = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
        }

        sendResponse(res, 200, {
            success: true,
            data: {
                sessionId: session._id,
                type: session.type,
                config: session.config,
                status: session.status,
                problems: session.problems.map(p => ({
                    problemId: (p.problem as any)?._id,
                    title: (p.problem as any)?.title,
                    difficulty: (p.problem as any)?.difficulty,
                    slug: (p.problem as any)?.slug,
                    order: p.order,
                    solved: p.solved,
                })),
                timeLimit: session.timeLimit,
                remainingTime,
                startedAt: session.startedAt,
                expiresAt: session.expiresAt,
            },
        });
    } catch (error) {
        handleError(error, res, 'getActiveMock');
    }
};

/**
 * @route   GET /api/mocks/stats
 * @desc    Get user's mock statistics
 * @access  Protected
 */
export const getMockStats = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const userId = req.user._id;

        // Aggregate stats
        const stats = await MockSession.aggregate([
            { $match: { user: userId, status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalCompleted: { $sum: 1 },
                    totalSolved: { $sum: '$score.solved' },
                    totalProblems: { $sum: '$score.total' },
                    avgPercentile: { $avg: '$score.percentile' },
                    avgSolveRate: {
                        $avg: {
                            $cond: [
                                { $gt: ['$score.total', 0] },
                                { $divide: ['$score.solved', '$score.total'] },
                                0,
                            ],
                        },
                    },
                    totalTime: { $sum: '$score.totalTime' },
                },
            },
        ]);

        // Get stats by type
        const statsByType = await MockSession.aggregate([
            { $match: { user: userId, status: 'completed' } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    solved: { $sum: '$score.solved' },
                    total: { $sum: '$score.total' },
                    avgPercentile: { $avg: '$score.percentile' },
                },
            },
        ]);

        // Get recent performance (last 10 mocks)
        const recentPerformance = await MockSession.find({
            user: userId,
            status: 'completed',
        })
            .sort({ completedAt: -1 })
            .limit(10)
            .select('type config score completedAt')
            .lean();

        const aggregated = stats[0] || {
            totalCompleted: 0,
            totalSolved: 0,
            totalProblems: 0,
            avgPercentile: 0,
            avgSolveRate: 0,
            totalTime: 0,
        };

        sendResponse(res, 200, {
            success: true,
            data: {
                overview: {
                    totalCompleted: aggregated.totalCompleted,
                    totalSolved: aggregated.totalSolved,
                    totalProblems: aggregated.totalProblems,
                    solveRate: Math.round((aggregated.avgSolveRate || 0) * 100),
                    avgPercentile: Math.round(aggregated.avgPercentile || 0),
                    totalTimeSpent: aggregated.totalTime,
                },
                byType: statsByType.reduce((acc, curr) => {
                    acc[curr._id] = {
                        count: curr.count,
                        solved: curr.solved,
                        total: curr.total,
                        avgPercentile: Math.round(curr.avgPercentile || 0),
                    };
                    return acc;
                }, {} as Record<string, object>),
                recentPerformance: recentPerformance.map(r => ({
                    type: r.type,
                    config: r.config,
                    score: r.score,
                    completedAt: r.completedAt,
                })),
            },
        });
    } catch (error) {
        handleError(error, res, 'getMockStats');
    }
};

/**
 * @route   GET /api/mocks/leaderboard
 * @desc    Get mock leaderboard
 * @access  Protected
 */
export const getMockLeaderboard = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const type = getQueryString(req.query.type);
        const company = getQueryString(req.query.company);
        const timeframe = getQueryString(req.query.timeframe);
        const limit = Math.min(100, getQueryNumber(req.query.limit, 20));

        // Build match filter
        const matchFilter: Record<string, unknown> = { status: 'completed' };

        if (type) matchFilter.type = type;
        if (company) matchFilter['config.company'] = { $regex: new RegExp(company, 'i') };

        // Timeframe filter
        if (timeframe === 'week') {
            matchFilter.completedAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        } else if (timeframe === 'month') {
            matchFilter.completedAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        }

        const leaderboard = await MockSession.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$user',
                    totalMocks: { $sum: 1 },
                    totalSolved: { $sum: '$score.solved' },
                    totalProblems: { $sum: '$score.total' },
                    avgPercentile: { $avg: '$score.percentile' },
                    bestScore: { $max: '$score.solved' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    name: '$user.name',
                    avatar: '$user.avatar',
                    totalMocks: 1,
                    totalSolved: 1,
                    totalProblems: 1,
                    solveRate: {
                        $round: [
                            { $multiply: [{ $divide: ['$totalSolved', '$totalProblems'] }, 100] },
                            1,
                        ],
                    },
                    avgPercentile: { $round: ['$avgPercentile', 0] },
                },
            },
            { $sort: { totalSolved: -1, solveRate: -1 } },
            { $limit: limit },
        ]);

        // Add rank
        const rankedLeaderboard = leaderboard.map((entry, index) => ({
            rank: index + 1,
            ...entry,
        }));

        // Find current user's rank
        const userRank = rankedLeaderboard.find(
            e => e.userId.toString() === req.user!._id.toString()
        );

        sendResponse(res, 200, {
            success: true,
            data: {
                leaderboard: rankedLeaderboard,
                userRank: userRank || null,
            },
        });
    } catch (error) {
        handleError(error, res, 'getMockLeaderboard');
    }
};
