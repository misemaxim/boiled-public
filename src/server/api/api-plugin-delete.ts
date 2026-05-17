import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { validateOperation } from '../lib/validate-operation';
import { API_ERRORS } from '../../types';

export const apiPluginDelete = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = await validateOperation(req);
    if (!validation) {
      throw new Error(API_ERRORS.FORBIDDEN_OPERATION);
    }

    const id = req.query.id as string;
    await serverStorage.plugin.delete(id);

    respond(req, res, null);
  } catch (error) {
    respond(req, res, null, error);
  }
};
