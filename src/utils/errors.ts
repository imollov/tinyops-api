import { Response } from 'express';

export function sendError(res: Response, statusCode: number, message: string, details?: unknown) {
  return res.status(statusCode).json({
    error: { message, details },
  });
}
