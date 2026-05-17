import crypto from 'node:crypto';
import { getConfig } from './get-config';

export const getEncryption = () => {
  const config = getConfig();

  const key = crypto.pbkdf2Sync(
    config.serverKey.slice(0, 16),
    config.serverKey.slice(-16),
    1,
    256 / 8,
    'sha512'
  );
  const iv = crypto.pbkdf2Sync(
    config.serverKey.slice(0, 16),
    config.serverKey.slice(-16),
    1,
    128 / 8,
    'sha512'
  );

  const encrypt = (value: string): string => {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encryptedValue = Buffer.from(
      cipher.update(value, 'utf8', 'binary') + cipher.final('binary'),
      'binary'
    ).toString('hex');

    return encryptedValue;
  };

  const decrypt = (value: string) => {
    const encryptedValue = Buffer.from(value, 'hex').toString('binary');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decryptedValue = decipher.update(encryptedValue, 'binary', 'utf8') + decipher.final('utf8');

    return decryptedValue;
  };

  return {
    encrypt,
    decrypt
  };
};

export const encryptionService = getEncryption();
