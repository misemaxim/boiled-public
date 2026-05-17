import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { validateOperation } from '../lib/validate-operation';
import { API_ERRORS, SessionSchema } from '../../types';

export const apiSessionCreate = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = await validateOperation(req);
    if (!validation) {
      throw new Error(API_ERRORS.FORBIDDEN_OPERATION);
    }

    const session = req.body as SessionSchema;

    const id = await serverStorage.session.create(session);

    respond(req, res, id);
  } catch (error) {
    respond(req, res, null, error);
  }
};
