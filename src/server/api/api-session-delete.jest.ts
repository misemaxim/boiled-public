import { apiSessionDelete } from './api-session-delete';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS, SessionSchema, SessionSchemaDev } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';
import testSession from '../../../tests/test-session.json';

describe('apiSessionDelete', () => {
  let req: Request;
  const session = Object.freeze({ ...testSession as SessionSchemaDev as SessionSchema }) as SessionSchema;

  beforeEach(async () => {
    const id = await serverStorage.session.create({ ...session });
    req = { query: { id } as Request['query'] } as Request;
  });

  test('should delete given session from the storage', async () => {
    const call = await jestApiTest(req, apiSessionDelete);

    expect(call.response).toEqual({
      data: null,
      completed: true,
      error: null
    });

    const session = await serverStorage.session.get(req.query.id as string);
    expect(session).toBe(undefined);
  });

  test('should fail if operation is not validated', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiSessionDelete);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });
});
