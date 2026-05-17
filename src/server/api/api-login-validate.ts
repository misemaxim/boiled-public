import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { validateOperation } from '../lib/validate-operation';

export const apiLoginvalidate = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = await validateOperation(req);

    respond(req, res, { username });
  } catch (error) {
    respond(req, res, null, error);
  }
};
