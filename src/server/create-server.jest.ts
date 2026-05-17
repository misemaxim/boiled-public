import { apiGetIcons } from './api/api-get-icons';
import { apiSessionCreate } from './api/api-session-create';
import { apiSessionDefinitions } from './api/api-session-definitions';
import { apiSessionGet } from './api/api-session-get';
import { apiSessionUpdate } from './api/api-session-update';
import { apiPluginGet } from './api/api-plugin-get';
import { apiPluginDefinitions } from './api/api-plugin-definitions';
import { apiPluginCreate } from './api/api-plugin-create';
import { apiPluginUpdate } from './api/api-plugin-update';
import { apiGetConfig } from './api/api-get-config';
import { apiLogin } from './api/api-login';
import { apiLoginvalidate } from './api/api-login-validate';
import { apiUserChangePassword } from './api/api-user-change-password';
import { createServer } from './create-server';
import { Application } from 'express';
import { jestMockCall } from '../../tests/jest-mock-call';
import { serverStorage } from './lib/server-storage';
import { getConfig } from './lib/get-config';
import { hashService } from './lib/hash-service';
import { API_ROUTES, ByPass, USER_TYPES } from '../types';
import { apiSessionDelete } from './api/api-session-delete';
import { apiPluginDelete } from './api/api-plugin-delete';
import { apiLogout } from './api/api-logout';
import { serverDocs } from './lib/serve-docs';

jest.mock('./lib/serve-docs', () => ({
  serverDocs: jest.fn()
}));

describe('createServer', () => {
  let app: Application;
  let registeredApi: [method: string, path: string, callbackName: string][] = [];

  const expectedApiConfigs: [method: string, path: string, callbackName: string][] = [
    ['get', API_ROUTES.CONFIG_GET, apiGetConfig.name],

    ['get', API_ROUTES.ICONS, apiGetIcons.name],

    ['get', API_ROUTES.SESSION_GET, apiSessionGet.name],
    ['get', API_ROUTES.SESSION_DELETE, apiSessionDelete.name],
    ['get', API_ROUTES.SESSION_DEFINTIONS, apiSessionDefinitions.name],
    ['post', API_ROUTES.SESSION_CREATE, apiSessionCreate.name],
    ['post', API_ROUTES.SESSION_UPDATE, apiSessionUpdate.name],

    ['get', API_ROUTES.PLUGIN_GET, apiPluginGet.name],
    ['get', API_ROUTES.PLUGIN_DELETE, apiPluginDelete.name],
    ['get', API_ROUTES.PLUGIN_DEFINTIONS, apiPluginDefinitions.name],
    ['post', API_ROUTES.PLUGIN_CREATE, apiPluginCreate.name],
    ['post', API_ROUTES.PLUGIN_UPDATE, apiPluginUpdate.name],

    ['post', API_ROUTES.LOGIN, apiLogin.name],
    ['get', API_ROUTES.LOGOUT, apiLogout.name],
    ['get', API_ROUTES.LOGIN_VALIDATE, apiLoginvalidate.name],

    ['post', API_ROUTES.USER_PASSWORD_CHANGE, apiUserChangePassword.name]
  ];

  beforeEach(() => {
    registeredApi = [];

    app = {
      use: jest.fn() as Application['use'],
      get: jest.fn((route, callback) => {
        registeredApi.push(['get', route, callback.name]);
      }) as unknown as Application['get'],
      post: jest.fn((route, callback) => {
        registeredApi.push(['post', route, callback.name]);
      }) as unknown as Application['get']
    } as Application;
  });

  describe('api', () => {
    beforeEach(async () => {
      await createServer(app);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should set body parser', () => {
      expect(app.use).toBeCalledTimes(1);
      const useCall = jestMockCall(app.use)[0][0];
      expect(useCall.name).toBe('jsonParser');
    });

    test('should set docs route', () => {
      expect(serverDocs).toBeCalledTimes(1);
      expect(serverDocs).toHaveBeenCalledWith(app);
    });

    test('should register expected api routes - total ' + expectedApiConfigs.length, () => {
      expect(registeredApi).toHaveLength(expectedApiConfigs.length);
    });

    expectedApiConfigs.forEach(expConfig => {
      test('should register - ' + expConfig[1], () => {
        const registeredConfig = registeredApi.filter(regConfig => regConfig.join('-') === expConfig.join('-'));
        expect(registeredConfig).toHaveLength(1);
      });
    });
  });

  describe('setup', () => {
    test('should create given superuser with default password if it does not exist', async () => {
      await createServer(app);

      const user = await serverStorage.users.get(getConfig().superUser);
      const hashCheck = await hashService.verify(user!.data.signature, 'password', user!.data.salt);

      expect(user?.data.type).toBe(USER_TYPES.SUPER);
      expect(hashCheck).toBe(true);
    });

    test('should not create superuser with default password if it exist', async () => {
      await serverStorage.users.create(USER_TYPES.SUPER, getConfig().superUser, 'pass-123');

      await createServer(app);

      const user = await serverStorage.users.get(getConfig().superUser);
      const hashCheck = await hashService.verify(user!.data.signature, 'pass-123', user!.data.salt);

      expect(hashCheck).toBe(true);
    });

    test('should delete old superuser and create given superuser', async () => {
      const previousUsername = 'not' + getConfig().superUser;

      await serverStorage.users.create(USER_TYPES.SUPER, previousUsername, 'pass-123');

      await createServer(app);

      const user = await serverStorage.users.get(getConfig().superUser);
      const hashCheck = await hashService.verify(user!.data.signature, 'password', user!.data.salt);

      expect(user?.data.type).toBe(USER_TYPES.SUPER);
      expect(hashCheck).toBe(true);

      const previousUser = await serverStorage.users.get(previousUsername);
      expect(previousUser).toBe(undefined);
    });

    test('should fail is superuser is not specified on config', async () => {
      (getConfig as jest.Mock).mockReturnValueOnce({ superUser: '' });

      let catchError = '';

      try {
        await createServer(app);

        const user = await serverStorage.users.get(getConfig().superUser);
        const hashCheck = await hashService.verify(user!.data.signature, 'pass-123', user!.data.salt);

        expect(hashCheck).toBe(true);
      } catch (error) {
        catchError = (error as ByPass).toString();
      }

      expect(catchError).toContain('SUPERUSER IS NOT CONFIGURED');
    });
  });
});
