import { apiSessionDefinitions } from './api-session-definitions';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS, SessionSchema, SessionSchemaDev } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';
import testSession from '../../../tests/test-session.json';

describe('apiPluginDefinitions', () => {
  let req: Request;

  beforeEach(async () => {
    req = { body: {} } as Request;
  });

  test('should return definitions for existing plugins', async () => {
    const [id1, id2] = await Promise.all([
      serverStorage.session.create(testSession as SessionSchemaDev as SessionSchema),
      serverStorage.session.create({ ...testSession, name: testSession.name + '-another' } as SessionSchemaDev as SessionSchema)
    ]);

    const call = await jestApiTest(req, apiSessionDefinitions);

    expect(call.response).toEqual({
      data: [
        {
          _id: id1,
          timestamp: 1696896000000,
          data: {
            name: testSession.name,
            created: 1696896000000
          },
          _rev: '1696896000000'
        },
        {
          _id: id2,
          timestamp: 1696896000000,
          data: {
            name: testSession.name + '-another',
            created: 1696896000000
          },
          _rev: '1696896000000'
        }
      ],
      completed: true,
      error: null
    });
  });

  test('should fail if operation is not validated', async () => {
    await serverStorage.session.create(testSession as SessionSchemaDev as SessionSchema);

    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiSessionDefinitions);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });
});