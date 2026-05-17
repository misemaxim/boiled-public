import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { validateOperation } from '../lib/validate-operation';
import { API_ERRORS, SessionSchema } from '../../types';

export const apiSessionUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = await validateOperation(req);
    if (!validation) {
      throw new Error(API_ERRORS.FORBIDDEN_OPERATION);
    }

    const session = req.body as SessionSchema;
    const id = req.query.id as string;

    await serverStorage.session.update(id, session);

    respond(req, res, null);
  } catch (error) {
    respond(req, res, null, error);
  }
};
