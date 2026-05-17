import { jestApiTest } from '../../../tests/jest-api-test';
import { Request } from 'express';
import { apiLoginvalidate } from './api-login-validate';
import { validateOperation } from '../lib/validate-operation';

describe('apiLoginvalidate', () => {
  let req: Request;

  beforeEach(() => {
    req = {} as Request;
  });

  test('should return username', async () => {
    const call = await jestApiTest(req, apiLoginvalidate);

    expect(call.response).toEqual({
      data: {
        username: 'someone'
      },
      completed: true,
      error: null
    });
  });

  test('should return no username if no logged user', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiLoginvalidate);

    expect(call.response).toEqual({
      data: {
        username: null
      },
      completed: true,
      error: null
    });
  });
});
