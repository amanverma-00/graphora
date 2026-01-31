import { Response } from 'express';
import mongoose from 'mongoose';
import Problem from '../models/problem';
import Submission from '../models/submission';
import MockSession from '../models/mockSession'
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
    getLanguageById,
    submitBatch,
    submitToken,
    getStatusDescription,
    SubmissionStatus,
} from '../utils/problemUtility';

interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

interface TestCaseResult {
    testCaseId: number;
    status: 'passed' | 'failed' | 'error';
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    runtime?: number;
    memory?: number;
}

interface SubmissionResult {
    submissionId: string;
    status: SubmissionStatus;
    runtime?: number;
    memory?: number;
    testCasesPassed: number;
    testCasesTotal: number;
    testCasesResults: TestCaseResult[];
    errorMessage?: string;
}

interface RunCodeResult {
    status: SubmissionStatus;
    output: string;
    runtime?: number;
    memory?: number;
    errorMessage?: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const config = {
    env: process.env.NODE_ENV || 'development',
    maxCodeLength: 65536, // 64KB
    maxPageLimit: 50,
    defaultPageLimit: 10,
};

const sendResponse = <T>(res: Response, statusCode: number, data: ApiResponse<T>): void => {
    res.status(statusCode).json(data);
};

const sendError = (res: Response, statusCode: number, message: string): void => {
    sendResponse(res, statusCode, { success: false, message });
};

const handleError = (error: unknown, res: Response, context: string): void => {
    console.error(`[${context}] Error:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    if (error instanceof Error && error.message.includes('API key')) {
        sendError(res, 503, 'Code execution service is temporarily unavailable');
        return;
    }

    if (error instanceof Error && error.message.includes('Rate limit')) {
        sendError(res, 429, 'Too many submissions. Please wait before trying again.');
        return;
    }

    sendResponse(res, 500, {
        success: false,
        message: `Error in ${context}`,
        error: config.env === 'development' ? errorMessage : undefined,
    });
};

const isValidObjectId = (id: string): boolean => {
    return mongoose.Types.ObjectId.isValid(id);
};

const getStringParam = (param: unknown): string => {
    if (typeof param === 'string') return param;
    if (Array.isArray(param)) return param[0] || '';
    return String(param || '');
};

const sanitizePagination = (page: unknown, limit: unknown): { page: number; limit: number; skip: number } => {
    const sanitizedPage = Math.max(1, parseInt(String(page || '1'), 10) || 1);
    const sanitizedLimit = Math.min(
        config.maxPageLimit,
        Math.max(1, parseInt(String(limit || config.defaultPageLimit), 10) || config.defaultPageLimit)
    );
    const skip = (sanitizedPage - 1) * sanitizedLimit;
    return { page: sanitizedPage, limit: sanitizedLimit, skip };
};

const normalizeLanguage = (language: string): string => {
    const langMap: Record<string, string> = {
        'javascript': 'javascript',
        'JavaScript': 'javascript',
        'python': 'python',
        'Python': 'python',
        'java': 'java',
        'Java': 'java',
        'c++': 'C++',
        'C++': 'C++',
        'cpp': 'C++',
    };
    return langMap[language] || language.toLowerCase();
};


/**
 * @route   POST /api/submit/submit/:id
 * @desc    Submit code for a problem (full evaluation)
 * @access  Protected
 */
export const submitCode = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const problemId = getStringParam(req.params.id);
        const { code, language, mockSessionId } = req.body;

        // Validate problem ID
        if (!isValidObjectId(problemId)) {
            sendError(res, 400, 'Invalid problem ID');
            return;
        }

        // Validate code length
        if (!code || typeof code !== 'string') {
            sendError(res, 400, 'Code is required');
            return;
        }

        if (code.length > config.maxCodeLength) {
            sendError(res, 400, `Code exceeds maximum length of ${config.maxCodeLength} characters`);
            return;
        }

        // Get problem with hidden test cases
        const problem = await Problem.findById(problemId)
            .select('hiddenTestCases visibleTestCases memoryLimit timeLimit title')
            .lean();

        if (!problem) {
            sendError(res, 404, 'Problem not found');
            return;
        }

        // Get language ID for Judge0
        const normalizedLang = normalizeLanguage(language);
        const languageId = getLanguageById(normalizedLang);

        if (!languageId) {
            sendError(res, 400, `Unsupported language: ${language}`);
            return;
        }

        // Combine visible and hidden test cases
        const allTestCases = [
            ...(problem.visibleTestCases || []),
            ...(problem.hiddenTestCases || []),
        ];

        if (allTestCases.length === 0) {
            sendError(res, 400, 'Problem has no test cases configured');
            return;
        }

        // Get attempt number
        const previousSubmissions = await Submission.countDocuments({
            user: req.user._id,
            problem: problemId,
        });
        const attemptNumber = previousSubmissions + 1;

        // Create initial submission record
        const submission = await Submission.create({
            user: req.user._id,
            problem: problemId,
            mockSession: mockSessionId && isValidObjectId(mockSessionId) ? mockSessionId : undefined,
            code,
            language: normalizedLang,
            status: 'Pending',
            testCasesPassed: 0,
            testCasesTotal: allTestCases.length,
            attemptNumber,
        });

        // Prepare submissions for Judge0
        const judge0Submissions = allTestCases.map(tc => ({
            source_code: code,
            language_id: languageId,
            stdin: tc.input,
            expected_output: tc.output,
            cpu_time_limit: (problem.timeLimit || 2000) / 1000,
            memory_limit: (problem.memoryLimit || 256) * 1024,
        }));

        // Submit to Judge0
        const batchResult = await submitBatch(judge0Submissions);

        if (!batchResult.success || !batchResult.tokens) {
            await Submission.findByIdAndUpdate(submission._id, {
                status: 'Internal Error',
                errorMessage: batchResult.message || 'Failed to submit to code execution service',
            });
            sendError(res, 503, batchResult.message || 'Code execution service unavailable');
            return;
        }

        // Store Judge0 tokens
        await Submission.findByIdAndUpdate(submission._id, {
            judge0SubmissionId: batchResult.tokens.join(','),
        });

        // Poll for results
        const resultsResponse = await submitToken(batchResult.tokens);

        if (!resultsResponse.success || !resultsResponse.results) {
            await Submission.findByIdAndUpdate(submission._id, {
                status: 'Internal Error',
                errorMessage: resultsResponse.message || 'Failed to get results',
            });
            sendError(res, 503, resultsResponse.message || 'Failed to get execution results');
            return;
        }

        // Process results
        const testCasesResults: TestCaseResult[] = [];
        let testCasesPassed = 0;
        let totalRuntime = 0;
        let totalMemory = 0;
        let finalStatus: SubmissionStatus = 'Accepted';
        let errorMessage: string | undefined;

        for (let i = 0; i < resultsResponse.results.length; i++) {
            const result = resultsResponse.results[i];
            const testCase = allTestCases[i];

            const tcResult: TestCaseResult = {
                testCaseId: i + 1,
                status: 'failed',
                runtime: result.runtime,
                memory: result.memory,
            };

            // Only include input/output for visible test cases
            if (i < (problem.visibleTestCases?.length || 0)) {
                tcResult.input = testCase.input;
                tcResult.expectedOutput = testCase.output;
                tcResult.actualOutput = result.stdout;
            }

            if (result.status === 'Accepted') {
                tcResult.status = 'passed';
                testCasesPassed++;
            } else if (result.status === 'Wrong Answer') {
                tcResult.status = 'failed';
                if (finalStatus === 'Accepted') {
                    finalStatus = 'Wrong Answer';
                }
            } else {
                tcResult.status = 'error';
                if (finalStatus === 'Accepted' || finalStatus === 'Wrong Answer') {
                    finalStatus = result.status;
                    errorMessage = result.compile_output || result.stderr || result.message;
                }
            }

            totalRuntime += result.runtime || 0;
            totalMemory = Math.max(totalMemory, result.memory || 0);
            testCasesResults.push(tcResult);
        }

        // Update submission with final results
        const updatedSubmission = await Submission.findByIdAndUpdate(
            submission._id,
            {
                status: finalStatus,
                runtime: totalRuntime,
                memory: totalMemory,
                testCasesPassed,
                testCasesResults,
                errorMessage,
                evaluatedAt: new Date(),
            },
            { new: true }
        );

        // Update problem statistics if accepted
        if (finalStatus === 'Accepted') {
            await Problem.findByIdAndUpdate(problemId, {
                $inc: { submissionsCount: 1, acceptedCount: 1 },
            });

            // Update mock session if applicable
            if (mockSessionId && isValidObjectId(mockSessionId)) {
                await MockSession.findOneAndUpdate(
                    { _id: mockSessionId, 'problems.problem': problemId },
                    {
                        $set: {
                            'problems.$.solved': true,
                            'problems.$.submission': submission._id,
                            'problems.$.completedAt': new Date(),
                        },
                        $inc: { 'score.solved': 1 },
                    }
                );
            }
        } else {
            await Problem.findByIdAndUpdate(problemId, {
                $inc: { submissionsCount: 1 },
            });
        }

        const responseData: SubmissionResult = {
            submissionId: updatedSubmission?._id.toString() || submission._id.toString(),
            status: finalStatus,
            runtime: totalRuntime,
            memory: totalMemory,
            testCasesPassed,
            testCasesTotal: allTestCases.length,
            testCasesResults: testCasesResults.filter(tc => tc.input !== undefined), // Only visible test cases
            errorMessage,
        };

        sendResponse(res, 200, {
            success: true,
            message: finalStatus === 'Accepted' ? 'All test cases passed!' : `${testCasesPassed}/${allTestCases.length} test cases passed`,
            data: responseData,
        });
    } catch (error) {
        handleError(error, res, 'submitCode');
    }
};

/**
 * @route   POST /api/submit/run/:id
 * @desc    Run code with custom input (without saving)
 * @access  Protected
 */
export const runCode = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const problemId = getStringParam(req.params.id);
        const { code, language, customInput } = req.body;

        // Validate problem ID
        if (!isValidObjectId(problemId)) {
            sendError(res, 400, 'Invalid problem ID');
            return;
        }

        // Validate code
        if (!code || typeof code !== 'string') {
            sendError(res, 400, 'Code is required');
            return;
        }

        if (code.length > config.maxCodeLength) {
            sendError(res, 400, `Code exceeds maximum length of ${config.maxCodeLength} characters`);
            return;
        }

        // Get problem for time/memory limits
        const problem = await Problem.findById(problemId)
            .select('memoryLimit timeLimit visibleTestCases')
            .lean();

        if (!problem) {
            sendError(res, 404, 'Problem not found');
            return;
        }

        // Get language ID
        const normalizedLang = normalizeLanguage(language);
        const languageId = getLanguageById(normalizedLang);

        if (!languageId) {
            sendError(res, 400, `Unsupported language: ${language}`);
            return;
        }

        // Use custom input or first visible test case
        const input = customInput !== undefined
            ? String(customInput)
            : (problem.visibleTestCases?.[0]?.input || '');

        // Submit single run to Judge0
        const submissions = [{
            source_code: code,
            language_id: languageId,
            stdin: input,
            cpu_time_limit: (problem.timeLimit || 2000) / 1000,
            memory_limit: (problem.memoryLimit || 256) * 1024,
        }];

        const batchResult = await submitBatch(submissions);

        if (!batchResult.success || !batchResult.tokens || batchResult.tokens.length === 0) {
            sendError(res, 503, batchResult.message || 'Code execution service unavailable');
            return;
        }

        // Get results
        const resultsResponse = await submitToken(batchResult.tokens);

        if (!resultsResponse.success || !resultsResponse.results || resultsResponse.results.length === 0) {
            sendError(res, 503, resultsResponse.message || 'Failed to get execution results');
            return;
        }

        const result = resultsResponse.results[0];

        const runResult: RunCodeResult = {
            status: result.status,
            output: result.stdout || '',
            runtime: result.runtime,
            memory: result.memory,
            errorMessage: result.compile_output || result.stderr || result.message || undefined,
        };

        sendResponse(res, 200, {
            success: true,
            data: {
                ...runResult,
                input,
            },
        });
    } catch (error) {
        handleError(error, res, 'runCode');
    }
};

/**
 * @route   GET /api/submit/history/:id
 * @desc    Get submission history for a problem
 * @access  Protected
 */
export const getSubmissionHistory = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const problemId = getStringParam(req.params.id);
        const { page, limit } = req.query;

        if (!isValidObjectId(problemId)) {
            sendError(res, 400, 'Invalid problem ID');
            return;
        }

        const problem = await Problem.findById(problemId)
            .select('title difficulty')
            .lean();

        if (!problem) {
            sendError(res, 404, 'Problem not found');
            return;
        }

        const { page: sanitizedPage, limit: sanitizedLimit, skip } = sanitizePagination(page, limit);

        const [submissions, total] = await Promise.all([
            Submission.find({
                user: req.user._id,
                problem: problemId,
            })
                .select('status language runtime memory testCasesPassed testCasesTotal attemptNumber createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(sanitizedLimit)
                .lean(),
            Submission.countDocuments({
                user: req.user._id,
                problem: problemId,
            }),
        ]);

        const pagination: PaginationInfo = {
            page: sanitizedPage,
            limit: sanitizedLimit,
            total,
            pages: Math.ceil(total / sanitizedLimit),
        };

        sendResponse(res, 200, {
            success: true,
            data: {
                problem: {
                    id: problemId,
                    title: problem.title,
                    difficulty: problem.difficulty,
                },
                submissions,
                pagination,
            },
        });
    } catch (error) {
        handleError(error, res, 'getSubmissionHistory');
    }
};

/**
 * @route   GET /api/submit/submission/:submissionId
 * @desc    Get a single submission details
 * @access  Protected
 */
export const getSubmissionById = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const submissionId = getStringParam(req.params.submissionId);

        if (!isValidObjectId(submissionId)) {
            sendError(res, 400, 'Invalid submission ID');
            return;
        }

        const submission = await Submission.findOne({
            _id: submissionId,
            user: req.user._id, // Ensure user can only access their own submissions
        })
            .populate('problem', 'title difficulty slug')
            .lean();

        if (!submission) {
            sendError(res, 404, 'Submission not found');
            return;
        }

        sendResponse(res, 200, {
            success: true,
            data: submission,
        });
    } catch (error) {
        handleError(error, res, 'getSubmissionById');
    }
};

/**
 * @route   GET /api/submit/recent
 * @desc    Get user's recent submissions across all problems
 * @access  Protected
 */
export const getRecentSubmissions = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            sendError(res, 401, 'Not authenticated');
            return;
        }

        const { page, limit, status } = req.query;
        const { page: sanitizedPage, limit: sanitizedLimit, skip } = sanitizePagination(page, limit);

        const query: Record<string, unknown> = { user: req.user._id };

        const statusStr = getStringParam(status);
        if (statusStr && ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error'].includes(statusStr)) {
            query.status = statusStr;
        }

        const [submissions, total] = await Promise.all([
            Submission.find(query)
                .select('status language runtime memory testCasesPassed testCasesTotal createdAt')
                .populate('problem', 'title difficulty slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(sanitizedLimit)
                .lean(),
            Submission.countDocuments(query),
        ]);

        const pagination: PaginationInfo = {
            page: sanitizedPage,
            limit: sanitizedLimit,
            total,
            pages: Math.ceil(total / sanitizedLimit),
        };

        sendResponse(res, 200, {
            success: true,
            data: { submissions, pagination },
        });
    } catch (error) {
        handleError(error, res, 'getRecentSubmissions');
    }
};

// ==================== EXPORTS ====================

export default {
    submitCode,
    runCode,
    getSubmissionHistory,
    getSubmissionById,
    getRecentSubmissions,
};
