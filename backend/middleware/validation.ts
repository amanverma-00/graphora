import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationError {
    field: string;
    message: string;
}

interface RequestData {
    body?: unknown;
    query?: unknown;
    params?: unknown;
}

// Extend Express Request to include validated data
declare global {
    namespace Express {
        interface Request {
            validatedQuery?: Record<string, unknown>;
            validatedParams?: Record<string, unknown>;
        }
    }
}

const validate = <T extends ZodSchema>(schema: T) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const data: RequestData = {
            body: req.body,
            query: req.query,
            params: req.params
        };

        try {
            const validated = await schema.parseAsync(data);

            // Only modify body (which is writable in Express 5)
            if (validated.body) req.body = validated.body;

            // Store validated query/params in custom properties (req.query is read-only in Express 5)
            if (validated.query) req.validatedQuery = validated.query;
            if (validated.params) req.validatedParams = validated.params;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: ValidationError[] = error.errors.map(err => ({
                    field: err.path.filter(p => !['body', 'query', 'params'].includes(String(p))).join('.') || 'unknown',
                    message: err.message
                }));

                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
                return;
            }

            console.error('[validate] Validation error:', error);
            res.status(500).json({
                success: false,
                message: 'Validation error occurred',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    };
};

export default validate;
export { validate, ValidationError };
