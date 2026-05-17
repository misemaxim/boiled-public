import { apiUserChangePassword } from './api-user-change-password';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS, USER_TYPES } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { hashService } from '../lib/hash-service';
import { validateOperation } from '../lib/validate-operation';

describe('apiLogin', () => {
  let req: Request;

  beforeEach(async () => {
    req = { body: {} } as Request;
    await serverStorage.users.create(USER_TYPES.ADMIN, 'someone', 'pass-123');
  });

  test('should follow requested password change', async () => {
    req.body = ['pass-123', 'pass-456', 'pass-456'];

    const call = await jestApiTest(req, apiUserChangePassword);
    const user = await serverStorage.users.get('someone');
    const hashCheck = await hashService.verify(user!.data.signature, 'pass-456', user!.data.salt);

    expect(hashCheck).toBe(true);
    expect(call.response).toEqual({
      data: null,
      completed: true,
      error: null
    });
  });

  test('should fail if operation is not validated', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    req.body = ['pass-123', 'pass-456', 'pass-456'];

    const call = await jestApiTest(req, apiUserChangePassword);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });

  test('should fail if current password is wrong', async () => {
    req.body = ['pass-000', 'pass-456', 'pass-456'];

    const call = await jestApiTest(req, apiUserChangePassword);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.PASSWORD_CHANGE_FAILED_CURRENT_PASSWORD
    });
  });

  test('should fail if repeat password is wrong', async () => {
    req.body = ['pass-123', 'pass-456', 'pass-789'];

    const call = await jestApiTest(req, apiUserChangePassword);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.PASSWORD_CHANGE_FAILED_REPEAT_PASSWORD
    });
  });
});
