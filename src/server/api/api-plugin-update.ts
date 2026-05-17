import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS, PluginSchemaRaw } from '../../types';
import { validateOperation } from '../lib/validate-operation';

export const apiPluginUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = await validateOperation(req);
    if (!validation) {
      throw new Error(API_ERRORS.FORBIDDEN_OPERATION);
    }

    const plugin = req.body as PluginSchemaRaw;
    const id = req.query.id as string;

    await serverStorage.plugin.update(id, plugin);

    respond(req, res, null);
  } catch (error) {
    respond(req, res, null, error);
  }
};
