import { apiPluginGet } from './api-plugin-get';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { PluginTypes, API_ERRORS } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';

describe('apiPluginGet', () => {
  let req: Request;

  beforeEach(async () => {
    const id = await serverStorage.plugin.create({
      type: PluginTypes.Coordinates,
      name: 'Test Plugin',
      script: 'TEST-PLUGIN-SCRIPT'
    });
    req = { query: { id } as Request['query'] } as Request;
  });

  test('should get given plugin from the storage', async () => {
    const call = await jestApiTest(req, apiPluginGet);

    expect(call.response).toEqual({
      data: {
        _id: req.query.id,
        timestamp: 1696896000000,
        data: {
          type: PluginTypes.Coordinates,
          name: 'Test Plugin',
          script: 'TEST-PLUGIN-SCRIPT'
        },
        _rev: '1696896000000'
      },
      completed: true,
      error: null
    });
  });

  test('should fail if operation is not validated', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiPluginGet);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });
});
