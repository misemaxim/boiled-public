import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS, PluginSchemaRaw } from '../../types';
import { validateOperation } from '../lib/validate-operation';

export const apiPluginCreate = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = await validateOperation(req);
    if (!validation) {
      throw new Error(API_ERRORS.FORBIDDEN_OPERATION);
    }

    const plugin = req.body as PluginSchemaRaw;

    const id = await serverStorage.plugin.create(plugin);

    respond(req, res, id);
  } catch (error) {
    respond(req, res, null, error);
  }
};
