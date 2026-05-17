import { apiLogin } from './api-login';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS, USER_TYPES } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { encryptionService } from '../lib/encryption-service';

describe('apiLogin', () => {
  let req: Request;

  beforeEach(async () => {
    req = { body: {} } as Request;
    await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
  });

  test('should log in given user', async () => {
    req.body.username = 'someone';
    req.body.password = 'pass-123';

    const call = await jestApiTest(req, apiLogin);

    expect(call.response).toEqual({
      data: null,
      completed: true,
      error: null
    });
  });

  test('should set cookie for logged in user', async () => {
    req.body.username = 'someone';
    req.body.password = 'pass-123';

    const spy = jest.spyOn(Math, 'random');

    const call = await jestApiTest(req, apiLogin);

    const cookie = (await serverStorage.users.get('someone'))!.data.cookie!;

    expect(call.mocks.cookie).toBeCalledTimes(1);
    expect(call.mocks.cookie).toHaveBeenCalledWith(
      '_boiled_signature',
      encryptionService.encrypt(
        JSON.stringify({
          username: [(spy.mock.results[0].value * 10000000000).toFixed(), 'someone'].join(':'),
          token: cookie.value
        })
      ),
      { maxAge: cookie.maxAge - Date.now(), httpOnly: true }
    );
  });

  test('should give an error if can not log in given user', async () => {
    req.body.username = 'someone';
    req.body.password = 'wrong';

    const call = await jestApiTest(req, apiLogin);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.INVALID_LOGIN
    });
  });
});