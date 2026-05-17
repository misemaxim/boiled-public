import crypto from 'node:crypto';
import * as argon2 from 'argon2';

const getEncryptedKey = (secret: string, salt: string) => crypto.pbkdf2Sync(secret, salt, 1, 256 / 8, 'sha512');

export const hashService = {
  get: async (secret: string, salt: string): Promise<string> => {
    const key = getEncryptedKey(secret, salt);
    return await argon2.hash(key);
  },
  verify: (hash: string, secret: string, salt: string) => {
    return argon2.verify(
      hash,
      getEncryptedKey(
        secret,
        salt
      )
    );
  }
};
