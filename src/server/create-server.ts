import bodyParser from 'body-parser';
import { apiGetIcons } from './api/api-get-icons';
import { apiSessionCreate } from './api/api-session-create';
import { apiSessionDefinitions } from './api/api-session-definitions';
import { apiSessionGet } from './api/api-session-get';
import { apiSessionUpdate } from './api/api-session-update';
import { Application } from 'express';
import { apiPluginGet } from './api/api-plugin-get';
import { apiPluginDefinitions } from './api/api-plugin-definitions';
import { apiPluginCreate } from './api/api-plugin-create';
import { apiPluginUpdate } from './api/api-plugin-update';
import { apiGetConfig } from './api/api-get-config';
import { apiLogin } from './api/api-login';
import { apiLoginvalidate } from './api/api-login-validate';
import { apiUserChangePassword } from './api/api-user-change-password';
import { serverStorage } from './lib/server-storage';
import { getConfig } from './lib/get-config';
import { API_ROUTES, USER_TYPES } from '../types';
import { apiPluginDelete } from './api/api-plugin-delete';
import { apiSessionDelete } from './api/api-session-delete';
import { apiLogout } from './api/api-logout';
import { serverDocs } from './lib/serve-docs';

const checkSuperUserWithInitialBypass = async () => {
  const superUserDefaultName = getConfig().superUser;

  if (superUserDefaultName) {
    const user = await serverStorage.users.get(superUserDefaultName);

    if (!user) {
      const existingSuperUser = await serverStorage.users.getSuperUser();
      if (existingSuperUser) {
        await serverStorage.users.delete(existingSuperUser.data.username);
      }

      await serverStorage.users.create(USER_TYPES.SUPER, superUserDefaultName, 'password');
    }
  } else {
    const errorText = 'SUPERUSER IS NOT CONFIGURED';
    throw new Error(errorText);
  }
};

const registerApi = (app: Application) => {
  app.use(bodyParser.json());
  serverDocs(app);

  app.get(API_ROUTES.CONFIG_GET, apiGetConfig);

  app.get(API_ROUTES.ICONS, apiGetIcons);

  app.get(API_ROUTES.SESSION_GET, apiSessionGet);
  app.get(API_ROUTES.SESSION_DELETE, apiSessionDelete);
  app.get(API_ROUTES.SESSION_DEFINTIONS, apiSessionDefinitions);
  app.post(API_ROUTES.SESSION_CREATE, apiSessionCreate);
  app.post(API_ROUTES.SESSION_UPDATE, apiSessionUpdate);

  app.get(API_ROUTES.PLUGIN_GET, apiPluginGet);
  app.get(API_ROUTES.PLUGIN_DELETE, apiPluginDelete);
  app.get(API_ROUTES.PLUGIN_DEFINTIONS, apiPluginDefinitions);
  app.post(API_ROUTES.PLUGIN_CREATE, apiPluginCreate);
  app.post(API_ROUTES.PLUGIN_UPDATE, apiPluginUpdate);

  app.post(API_ROUTES.LOGIN, apiLogin);
  app.get(API_ROUTES.LOGOUT, apiLogout);
  app.get(API_ROUTES.LOGIN_VALIDATE, apiLoginvalidate);

  app.post(API_ROUTES.USER_PASSWORD_CHANGE, apiUserChangePassword);
};

export const createServer = async (app: Application) => {
  registerApi(app);

  await checkSuperUserWithInitialBypass();
};
