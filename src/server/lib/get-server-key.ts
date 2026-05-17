import fs from 'fs';
import { nanoid } from 'nanoid';

export const getServerKey = () => {
  const keyFile = 'server.key';

  if (fs.existsSync(keyFile)) {
    const key = fs.readFileSync(keyFile, 'utf8').trim();
    if (key) {
      return key;
    }
  }

  const newKey = nanoid(32);
  fs.writeFileSync(keyFile, newKey, 'utf8');

  return newKey;
};
