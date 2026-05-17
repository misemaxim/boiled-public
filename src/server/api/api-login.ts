import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { serverStorage } from '../lib/server-storage';
import { nanoid } from 'nanoid';
import { hashService } from '../lib/hash-service';
import { encryptionService } from '../lib/encryption-service';
import { API_ERRORS } from '../../types';

export const apiLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    const user = await serverStorage.users.get(username);

    const validation = user && await hashService.verify(user.data.signature, password, user.data.salt);

    if (validation) {
      const token = nanoid(32);
      const cookieMaxAge = 30 * 24 * 60 * 60 * 1000;

      await serverStorage.users.update(username, {
        ...user.data,
        cookie: {
          value: token,
          maxAge: Date.now() + cookieMaxAge
        }
      });

      const userSignature = encryptionService.encrypt(
        JSON.stringify({ username: [(Math.random() * 10000000000).toFixed(), username].join(':'), token })
      );

      res.cookie(
        '_boiled_signature',
        userSignature,
        { maxAge: cookieMaxAge, httpOnly: true }
      );
    } else {
      throw new Error(API_ERRORS.INVALID_LOGIN);
    }

    respond(req, res, null);
  } catch (error) {
    respond(req, res, null, error);
  }
};
