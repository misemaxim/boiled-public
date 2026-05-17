import { respond } from '../lib/respond';
import { omit } from 'lodash';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS } from '../../types';
import { validateOperation } from '../lib/validate-operation';

export const apiLogout = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = await validateOperation(req);
    if (!username) {
      throw new Error(API_ERRORS.INVALID_LOGIN);
    }

    const user = await serverStorage.users.get(username);
    await serverStorage.users.update(username, omit(user!.data, 'cookie'));

    res.clearCookie('_boiled_signature');

    respond(req, res, null);
  } catch (error) {
    respond(req, res, null, error);
  }
};
