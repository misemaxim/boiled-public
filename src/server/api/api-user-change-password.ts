import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { hashService } from '../lib/hash-service';
import { validateOperation } from '../lib/validate-operation';
import { omit } from 'lodash';
import { API_ERRORS } from '../../types';

export const apiUserChangePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = await validateOperation(req);
    if (!username) {
      throw new Error(API_ERRORS.FORBIDDEN_OPERATION);
    }

    const [currentPassword, newPassword, repeatNewPassword] = req.body;
    const user = (await serverStorage.users.get(username))!;

    if (newPassword !== repeatNewPassword) {
      throw new Error(API_ERRORS.PASSWORD_CHANGE_FAILED_REPEAT_PASSWORD);
    }

    if (!(await hashService.verify(user.data.signature, currentPassword, user.data.salt))) {
      throw new Error(API_ERRORS.PASSWORD_CHANGE_FAILED_CURRENT_PASSWORD);
    }

    await serverStorage.users.update(username, {
      ...omit(user.data, 'cookie'),
      signature: await hashService.get(newPassword, user.data.salt)
    });

    respond(req, res, null);
  } catch (error) {
    respond(req, res, null, error);
  }
};
