import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS } from '../../types';
import { validateOperation } from '../lib/validate-operation';
import { getConfig } from '../lib/get-config';

export const apiSessionGet = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.query.id as string;

    const validation = await validateOperation(req);
    if (!validation) {
      const config = getConfig();
      const publicSessionId = config.app.public.enabled && config.app.public.sessionId;
      if (id !== publicSessionId) {
        throw new Error(API_ERRORS.FORBIDDEN_OPERATION);
      }
    }

    const session = await serverStorage.session.get(id);
    if (!validation && session) {
      session.data.plugins = [];
      session.data.groups.forEach(group => {
        group.plugins = [];
      });
    }

    respond(req, res, session);
  } catch (error) {
    respond(req, res, null, error);
  }
};
