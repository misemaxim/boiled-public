import { apiSessionUpdate } from './api-session-update';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS, SessionSchema, SessionSchemaDev } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';
import testSession from '../../../tests/test-session.json';

describe('apiPluginUpdate', () => {
  let req: Request;

  beforeEach(async () => {
    const id = await serverStorage.session.create(testSession as SessionSchemaDev as SessionSchema);
    req = {
      query: { id } as Request['query'],
      body: {
        ...testSession,
        name: testSession.name + '-updated'
      }
    } as Request;
  });

  test('should update given session in the storage', async () => {
    const call = await jestApiTest(req, apiSessionUpdate);

    expect(call.response).toEqual({
      data: null,
      completed: true,
      error: null
    });

    const session = await serverStorage.session.get(req.query.id as string);
    expect(session?.data).toEqual({
      ...testSession,
      name: testSession.name + '-updated'
    });
  });

  test('should fail if operation is not validated', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiSessionUpdate);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });
});
