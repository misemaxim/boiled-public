import { apiLogout } from './api-logout';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS, USER_TYPES } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';

describe('apiLogout', () => {
  let req: Request;

  beforeEach(async () => {
    req = { body: {} } as Request;
    await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
    const user = (await serverStorage.users.get('someone'))!;
    await serverStorage.users.update('someone', { ...user.data, cookie: { value: 'TOKEN', maxAge: 123 } });
  });

  test('should log out given user', async () => {
    const call = await jestApiTest(req, apiLogout);

    const user = (await serverStorage.users.get('someone'))!;
    expect(user.data.cookie).toBe(undefined);

    expect(call.mocks.clearCookie).toBeCalledTimes(1);
    expect(call.mocks.clearCookie).toHaveBeenCalledWith('_boiled_signature');

    expect(call.response).toEqual({
      data: null,
      completed: true,
      error: null
    });
  });

  test('should give an error if no user on request', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiLogout);

    const user = (await serverStorage.users.get('someone'))!;
    expect(user.data.cookie).toEqual({ value: 'TOKEN', maxAge: 123 });

    expect(call.mocks.clearCookie).toBeCalledTimes(0);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.INVALID_LOGIN
    });
  });
});