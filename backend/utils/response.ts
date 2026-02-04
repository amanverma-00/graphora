import { Response } from 'express'

/**
 * Utility functions for standardized API responses
 */

export function sendSuccess(
  res: Response,
  statusCode?: number,
  message?: string,
  data?: any,
): void

export function sendSuccess(
  res: Response,
  statusCode: number = 200,
  a?: unknown,
  b?: unknown,
): void {
  // Supports both call patterns:
  // - sendSuccess(res, 200, 'message', { data })
  // - sendSuccess(res, 200, { data }, 'message')
  const message =
    typeof a === 'string' ? a : typeof b === 'string' ? b : undefined
  const data = typeof a === 'string' ? b : a

  res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  })
}

export const sendError = (
  res: Response,
  statusCode: number = 500,
  message: string = 'Internal server error',
  errors?: any,
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  })
}
