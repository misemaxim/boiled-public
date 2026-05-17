import { apiSessionGet } from './api-session-get';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { API_ERRORS, SessionSchema, SessionSchemaDev } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';
import testSession from '../../../tests/test-session.json';
import { getConfig } from '../lib/get-config';

describe('apiPluginGet', () => {
  let req: Request;
  const session = Object.freeze({
    ...testSession as SessionSchemaDev as SessionSchema,
    groups: testSession.groups.map(group => ({ ...group, plugins: ['1'] })),
    plugins: ['2']
  }) as SessionSchema;

  beforeEach(async () => {
    const id = await serverStorage.session.create({ ...session });
    req = { query: { id } as Request['query'] } as Request;
  });

  test('should get given session from the storage', async () => {
    const call = await jestApiTest(req, apiSessionGet);

    expect(call.response).toEqual({
      data: {
        _id: req.query.id,
        timestamp: 1696896000000,
        data: session,
        _rev: '1696896000000'
      },
      completed: true,
      error: null
    });
  });

  test('should get given session as public from the storage', async () => {
    const publicSession = {
      ...testSession as SessionSchemaDev as SessionSchema,
      groups: testSession.groups.map(group => ({ ...group, plugins: [] })),
      plugins: []
    } as SessionSchema;
    (getConfig as jest.Mock).mockReturnValueOnce({ app: { public: { enabled: true, sessionId: req.query.id } } });
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiSessionGet);

    expect(call.response).toEqual({
      data: {
        _id: req.query.id,
        timestamp: 1696896000000,
        data: publicSession,
        _rev: '1696896000000'
      },
      completed: true,
      error: null
    });
  });

  test('should fail if operation is not validated and set public session is not active', async () => {
    (getConfig as jest.Mock).mockReturnValueOnce({ app: { public: { enabled: false, sessionId: req.query.id } } });
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiSessionGet);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });

  test('should fail if operation is not validated and public session is set to different session', async () => {
    (getConfig as jest.Mock).mockReturnValueOnce({ app: { public: { enabled: true, sessionId: 'public-session' } } });
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiSessionGet);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });
});
