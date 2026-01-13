import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle PayloadTooLargeError from body-parser
  if (err.message && err.message.includes('request entity too large')) {
    console.error('PAYLOAD TOO LARGE:', {
      path: req.path,
      contentLength: req.headers['content-length'],
    });
    return res.status(413).json({
      status: 'error',
      message: 'הקבצים גדולים מדי. אנא צמצם את התמונות או העלה פחות תמונות.',
    });
  }

  // Log all errors for debugging
  console.error('ERROR HANDLER:', {
    message: err.message,
    statusCode: err instanceof AppError ? err.statusCode : 500,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'שואת שרת פנימית' 
      : err.message,
  });
};
