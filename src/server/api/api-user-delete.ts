import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { validateOperation } from '../lib/validate-operation';
import { API_ERRORS } from '../../types';
import { getConfig } from '../lib/get-config';

export const apiUserDelete = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = await validateOperation(req);
    const superUser = getConfig().superUser;
    const username = req.query.username as string;

    if (validation !== superUser || username === superUser) {
      throw new Error(API_ERRORS.FORBIDDEN_OPERATION);
    }

    await serverStorage.users.delete(username);

    respond(req, res, null);
  } catch (error) {
    respond(req, res, null, error);
  }
};
