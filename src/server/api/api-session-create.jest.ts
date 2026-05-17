import { apiSessionCreate } from './api-session-create';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';
import testSession from '../../../tests/test-session.json';

describe('apiSessionCreate', () => {
  let req: Request;

  beforeEach(() => {
    req = { body: testSession } as Request;
  });

  test('should put given session in the storage', async () => {
    const call = await jestApiTest(req, apiSessionCreate);
    const sessionId = call.response.data;

    const session = await serverStorage.session.get(sessionId);
    expect(session?.data).toEqual(testSession);
    expect(call.response).toEqual({
      data: sessionId,
      completed: true,
      error: null
    });
  });

  test('should fail if operation is not validated', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiSessionCreate);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });
});
