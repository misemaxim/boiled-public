import { Request } from 'express';
import { encryptionService } from './encryption-service';
import { serverStorage } from './server-storage';

const getServerCookies = (req: Request): string | null => {
  if (!req.headers.cookie) {
    return null;
  }

  const namePath = '_boiled_signature=';
  const cookiesArray = req.headers.cookie.split(';');

  for (let i = 0; i < cookiesArray.length; i++) {
    let cookieString = cookiesArray[i];
    while (cookieString.charAt(0) === ' ') {
      cookieString = cookieString.substring(1, cookieString.length);
    }

    if (cookieString.indexOf(namePath) === 0) {
      return cookieString.substring(namePath.length, cookieString.length);
    }
  }

  return null;
};

export const validateOperation = async (req: Request): Promise<string | null> => {
  const encryptedToken = getServerCookies(req) as string;
  if (!encryptedToken) {
    return null;
  }

  try {
    const crewToken = JSON.parse(encryptionService.decrypt(encryptedToken));

    const username = crewToken.username.split(':')[1] as string;
    const user = await serverStorage.users.get(username);

    if (user) {
      const token = crewToken.token;

      const validation =
      user.data.cookie &&
      user.data.cookie.value === token &&
      user.data.cookie.maxAge > Date.now() &&
      username;

      return validation ? username : null;
    }

    return null;
  } catch (error) {
    return null;
  }
};
