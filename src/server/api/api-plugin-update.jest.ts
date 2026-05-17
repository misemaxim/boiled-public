import { apiPluginUpdate } from './api-plugin-update';
import { Request } from 'express';
import { serverStorage } from '../lib/server-storage';
import { PluginTypes, API_ERRORS } from '../../types';
import { jestApiTest } from '../../../tests/jest-api-test';
import { validateOperation } from '../lib/validate-operation';

describe('apiPluginUpdate', () => {
  let req: Request;

  beforeEach(async () => {
    const id = await serverStorage.plugin.create({
      type: PluginTypes.Coordinates,
      name: 'Test Plugin',
      script: 'TEST-PLUGIN-SCRIPT'
    });
    req = {
      query: { id } as Request['query'],
      body: {
        type: PluginTypes.Coordinates,
        name: 'Test Plugin Updated',
        script: 'TEST-PLUGIN-SCRIPT-UPDATED'
      }
    } as Request;
  });

  test('should update given plugin in the storage', async () => {
    const call = await jestApiTest(req, apiPluginUpdate);

    expect(call.response).toEqual({
      data: null,
      completed: true,
      error: null
    });

    const plugin = await serverStorage.plugin.get(req.query.id as string);
    expect(plugin?.data).toEqual({
      type: PluginTypes.Coordinates,
      name: 'Test Plugin Updated',
      script: 'TEST-PLUGIN-SCRIPT-UPDATED'
    });
  });

  test('should fail if operation is not validated', async () => {
    (validateOperation as jest.Mock).mockResolvedValueOnce(null);

    const call = await jestApiTest(req, apiPluginUpdate);

    expect(call.response).toEqual({
      data: null,
      completed: false,
      error: API_ERRORS.FORBIDDEN_OPERATION
    });
  });
});
