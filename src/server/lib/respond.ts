import { Request, Response } from 'express';
import { API_ERRORS, ByPass } from '../../types';
import { logger } from './logger';

export const respond = <T>(
  req: Request,
  res: Response,
  data: T | null,
  error?: ByPass
): void => {
  const errorMessage = (error: ByPass) => {
    return error.message && Object.values(API_ERRORS).includes(error.message) ? error.message : 'UNEXPECTED';
  };

  if (error) {
    logger.error(error.toString());
  }

  res.status(200).json({
    data: data,
    error: error ? errorMessage(error) : null,
    completed: !error
  });
};
