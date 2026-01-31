import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export type SubmissionLanguage = 'javascript' | 'python' | 'java' | 'C++';

export type SubmissionStatus =
    | 'Pending'
    | 'Accepted'
    | 'Wrong Answer'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'Runtime Error'
    | 'Compilation Error'
    | 'Internal Error';

export type TestCaseStatus = 'passed' | 'failed' | 'error';

interface Judge0Submission {
    source_code: string;
    language_id: number;
    stdin?: string;
    expected_output?: string;
    cpu_time_limit?: number;
    memory_limit?: number;
}

interface Judge0Result {
    token: string;
    status_id: number;
    status: SubmissionStatus;
    stdout: string;
    stderr: string;
    compile_output: string;
    message: string;
    runtime: number;
    memory: number;
    created_at?: string;
    finished_at?: string;
}

interface SubmitBatchResult {
    success: boolean;
    tokens?: string[];
    message?: string;
    error?: string;
}

interface GetResultsResult {
    success: boolean;
    results?: Judge0Result[];
    retries?: number;
    message?: string;
    error?: string;
}

interface SubmitSingleResult {
    success: boolean;
    token?: string;
    message?: string;
    error?: string;
}

// ==================== CONFIGURATION ====================

const JUDGE0_CONFIG = {
    BASE_URL: process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com',
    RAPIDAPI_HOST: process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com',
    TIMEOUT: 30000,
    MAX_POLL_RETRIES: 30,
    POLL_INTERVAL: 1000,
    MAX_SOURCE_CODE_LENGTH: 65536, // 64KB max code length
    MAX_STDIN_LENGTH: 65536,       // 64KB max input length
} as const;

// Language ID mapping for Judge0 CE
const LANGUAGE_MAP: Record<string, number> = {
    'javascript': 63,   // Node.js (12.14.0)
    'python': 71,       // Python (3.8.1)
    'java': 62,         // Java (OpenJDK 13.0.1)
    'c++': 54,          // C++ (GCC 9.2.0)
    'C++': 54,          // Uppercase alias
};

// Maps Judge0 status IDs to Submission schema status values
const STATUS_MAP: Record<number, SubmissionStatus> = {
    1: 'Pending',              // In Queue
    2: 'Pending',              // Processing
    3: 'Accepted',             // Accepted
    4: 'Wrong Answer',         // Wrong Answer
    5: 'Time Limit Exceeded',  // Time Limit Exceeded
    6: 'Compilation Error',    // Compilation Error
    7: 'Runtime Error',        // Runtime Error (SIGSEGV)
    8: 'Runtime Error',        // Runtime Error (SIGXFSZ)
    9: 'Runtime Error',        // Runtime Error (SIGFPE)
    10: 'Runtime Error',       // Runtime Error (SIGABRT)
    11: 'Runtime Error',       // Runtime Error (NZEC)
    12: 'Runtime Error',       // Runtime Error (Other)
    13: 'Internal Error',      // Internal Error
    14: 'Runtime Error',       // Exec Format Error
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get Judge0 language ID from language name
 */
export const getLanguageById = (language: string): number | null => {
    const normalizedLang = language.toLowerCase().trim();
    return LANGUAGE_MAP[normalizedLang] ?? null;
};

/**
 * Get status description from Judge0 status ID
 */
export const getStatusDescription = (statusId: number): SubmissionStatus => {
    return STATUS_MAP[statusId] ?? 'Internal Error';
};

/**
 * Delay utility for polling
 */
const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validate and get API key
 */
const getApiKey = (): string => {
    const apiKey = process.env.JUDGE0_KEY;
    if (!apiKey) {
        throw new Error('Judge0 API key not configured');
    }
    return apiKey;
};

/**
 * Sanitize source code (remove null bytes, limit length)
 */
const sanitizeCode = (code: string): string => {
    if (!code || typeof code !== 'string') {
        throw new Error('Invalid source code');
    }

    // Remove null bytes and other dangerous characters
    const sanitized = code.replace(/\x00/g, '');

    if (sanitized.length > JUDGE0_CONFIG.MAX_SOURCE_CODE_LENGTH) {
        throw new Error(`Source code exceeds maximum length of ${JUDGE0_CONFIG.MAX_SOURCE_CODE_LENGTH} characters`);
    }

    return sanitized;
};

/**
 * Sanitize stdin input
 */
const sanitizeInput = (input: string): string => {
    if (!input) return '';

    const sanitized = input.replace(/\x00/g, '');

    if (sanitized.length > JUDGE0_CONFIG.MAX_STDIN_LENGTH) {
        throw new Error(`Input exceeds maximum length of ${JUDGE0_CONFIG.MAX_STDIN_LENGTH} characters`);
    }

    return sanitized;
};

/**
 * Create axios config with security headers
 */
const createAxiosConfig = (method: string, url: string, data?: unknown): AxiosRequestConfig => ({
    method,
    url,
    headers: {
        'x-rapidapi-key': getApiKey(),
        'x-rapidapi-host': JUDGE0_CONFIG.RAPIDAPI_HOST,
        'Content-Type': 'application/json',
    },
    timeout: JUDGE0_CONFIG.TIMEOUT,
    data,
});

/**
 * Handle axios errors and return standardized response
 */
const handleAxiosError = (error: unknown, context: string): { success: false; message: string; error: string } => {
    console.error(`[${context}] Error:`, error instanceof Error ? error.message : 'Unknown error');

    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;

        if (axiosError.response) {
            const status = axiosError.response.status;
            const message = axiosError.response.data?.message || axiosError.message;

            switch (status) {
                case 429:
                    return {
                        success: false,
                        message: 'Rate limit exceeded. Please try again later.',
                        error: 'RATE_LIMIT_EXCEEDED',
                    };
                case 401:
                    return {
                        success: false,
                        message: 'Invalid API key. Please check your Judge0 configuration.',
                        error: 'INVALID_API_KEY',
                    };
                case 403:
                    return {
                        success: false,
                        message: 'Access forbidden. Check your API permissions.',
                        error: 'FORBIDDEN',
                    };
                default:
                    return {
                        success: false,
                        message: `Judge0 API error: ${message}`,
                        error: `API_ERROR_${status}`,
                    };
            }
        }

        if (axiosError.request) {
            return {
                success: false,
                message: 'No response from Judge0 service. Please try again.',
                error: 'NO_RESPONSE',
            };
        }
    }

    return {
        success: false,
        message: `Failed in ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'REQUEST_ERROR',
    };
};

// ==================== MAIN FUNCTIONS ====================

/**
 * Submit multiple code submissions as a batch
 */
export const submitBatch = async (
    submissions: Judge0Submission[]
): Promise<SubmitBatchResult> => {
    try {
        if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
            throw new Error('No submissions provided');
        }

        if (submissions.length > 20) {
            throw new Error('Maximum 20 submissions allowed per batch');
        }

        // Validate and sanitize each submission
        const preparedSubmissions = submissions.map((sub, index) => {
            if (!sub.source_code) {
                throw new Error(`Submission ${index + 1}: source_code is required`);
            }
            if (!sub.language_id) {
                throw new Error(`Submission ${index + 1}: language_id is required`);
            }

            return {
                source_code: sanitizeCode(sub.source_code),
                language_id: sub.language_id,
                stdin: sanitizeInput(sub.stdin || ''),
                expected_output: sub.expected_output || '',
                cpu_time_limit: Math.min(sub.cpu_time_limit || 2, 10), // Max 10 seconds
                memory_limit: Math.min(sub.memory_limit || 256000, 512000), // Max 512MB
            };
        });

        const config = createAxiosConfig(
            'POST',
            `${JUDGE0_CONFIG.BASE_URL}/submissions/batch?base64_encoded=false`,
            { submissions: preparedSubmissions }
        );

        const response = await axios.request(config);

        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response from Judge0');
        }

        return {
            success: true,
            tokens: response.data.map((item: { token: string }) => item.token),
        };
    } catch (error) {
        return handleAxiosError(error, 'submitBatch');
    }
};

/**
 * Get results for submitted tokens with polling
 */
export const submitToken = async (tokens: string[]): Promise<GetResultsResult> => {
    try {
        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
            throw new Error('No tokens provided');
        }

        // Validate tokens format (should be alphanumeric with dashes)
        const validTokenPattern = /^[a-zA-Z0-9-]+$/;
        tokens.forEach((token, index) => {
            if (!validTokenPattern.test(token)) {
                throw new Error(`Invalid token format at index ${index}`);
            }
        });

        let retries = 0;
        const maxRetries = JUDGE0_CONFIG.MAX_POLL_RETRIES;

        while (retries < maxRetries) {
            retries++;

            const config: AxiosRequestConfig = {
                method: 'GET',
                url: `${JUDGE0_CONFIG.BASE_URL}/submissions/batch`,
                params: {
                    tokens: tokens.join(','),
                    base64_encoded: 'false',
                    fields: '*',
                },
                headers: {
                    'x-rapidapi-key': getApiKey(),
                    'x-rapidapi-host': JUDGE0_CONFIG.RAPIDAPI_HOST,
                },
                timeout: JUDGE0_CONFIG.TIMEOUT,
            };

            try {
                const response = await axios.request(config);

                if (!response.data || !response.data.submissions) {
                    throw new Error('Invalid response from Judge0');
                }

                const submissions = response.data.submissions;

                // Check if all submissions are done processing (status > 2)
                const allCompleted = submissions.every(
                    (sub: { status?: { id: number } }) => sub.status && sub.status.id > 2
                );

                if (allCompleted) {
                    const processedResults: Judge0Result[] = submissions.map(
                        (sub: {
                            token: string;
                            status?: { id: number };
                            stdout?: string;
                            stderr?: string;
                            compile_output?: string;
                            message?: string;
                            time?: string;
                            memory?: string;
                            created_at?: string;
                            finished_at?: string;
                        }) => ({
                            token: sub.token,
                            status_id: sub.status?.id || 13,
                            status: getStatusDescription(sub.status?.id || 13),
                            stdout: sub.stdout || '',
                            stderr: sub.stderr || '',
                            compile_output: sub.compile_output || '',
                            message: sub.message || '',
                            runtime: parseFloat(sub.time || '0') * 1000, // Convert to ms
                            memory: parseInt(sub.memory || '0', 10),
                            created_at: sub.created_at,
                            finished_at: sub.finished_at,
                        })
                    );

                    return {
                        success: true,
                        results: processedResults,
                        retries,
                    };
                }
            } catch (pollError) {
                if (retries === maxRetries) {
                    throw pollError;
                }
            }

            await delay(JUDGE0_CONFIG.POLL_INTERVAL);
        }

        return {
            success: false,
            message: 'Timeout: Could not get results after maximum retries',
            error: 'TIMEOUT_ERROR',
        };
    } catch (error) {
        return handleAxiosError(error, 'submitToken');
    }
};

/**
 * Submit a single code submission
 */
export const submitSingle = async (submission: Judge0Submission): Promise<SubmitSingleResult> => {
    try {
        if (!submission) {
            throw new Error('No submission provided');
        }

        if (!submission.source_code) {
            throw new Error('source_code is required');
        }

        if (!submission.language_id) {
            throw new Error('language_id is required');
        }

        const config = createAxiosConfig(
            'POST',
            `${JUDGE0_CONFIG.BASE_URL}/submissions?base64_encoded=false&wait=false`,
            {
                source_code: sanitizeCode(submission.source_code),
                language_id: submission.language_id,
                stdin: sanitizeInput(submission.stdin || ''),
                expected_output: submission.expected_output || '',
                cpu_time_limit: Math.min(submission.cpu_time_limit || 2, 10),
                memory_limit: Math.min(submission.memory_limit || 256000, 512000),
            }
        );

        const response = await axios.request(config);

        if (!response.data || !response.data.token) {
            throw new Error('Invalid response from Judge0');
        }

        return {
            success: true,
            token: response.data.token,
        };
    } catch (error) {
        return handleAxiosError(error, 'submitSingle');
    }
};

/**
 * Validate if a language is supported
 */
export const isLanguageSupported = (language: string): boolean => {
    return getLanguageById(language) !== null;
};

/**
 * Get all supported languages
 */
export const getSupportedLanguages = (): string[] => {
    return Object.keys(LANGUAGE_MAP).filter(lang => lang === lang.toLowerCase());
};

// ==================== EXPORTS ====================

export { LANGUAGE_MAP, STATUS_MAP, JUDGE0_CONFIG };

export default {
    getLanguageById,
    submitBatch,
    submitToken,
    submitSingle,
    getStatusDescription,
    isLanguageSupported,
    getSupportedLanguages,
    LANGUAGE_MAP,
    STATUS_MAP,
};