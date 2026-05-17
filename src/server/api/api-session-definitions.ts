import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { validateOperation } from '../lib/validate-operation';
import { API_ERRORS } from '../../types';

export const apiSessionDefinitions = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = await validateOperation(req);
    if (!validation) {
      throw new Error(API_ERRORS.FORBIDDEN_OPERATION);
    }

    const definitions = await serverStorage.session.definitions();

    respond(req, res, definitions);
  } catch (error) {
    respond(req, res, null, error);
  }
};
